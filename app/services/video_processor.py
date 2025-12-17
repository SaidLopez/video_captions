import ffmpeg
import subprocess
import json
import asyncio
from pathlib import Path
from typing import Optional, List, Tuple
from app.models import Transcription, TranscriptionSegment
from app.schemas import CaptionConfig, CaptionStyle, CaptionPosition, FontWeight
from app.core.logging import get_logger
from app.core.exceptions import VideoProcessingError
from app.core.config import get_settings

logger = get_logger(__name__)


class CaptionStyler:
    STYLE_PRESETS = {
        CaptionStyle.TIKTOK: {
            "font": "Arial",
            "font_size": 52,
            "font_color": "#FFFFFF",
            "stroke_color": "#000000",
            "stroke_width": 4,
            "background_color": None,
            "highlight_color": "#00FF00",
            "shadow": True,
        },
        CaptionStyle.INSTAGRAM: {
            "font": "Helvetica",
            "font_size": 48,
            "font_color": "#FFFFFF",
            "stroke_color": "#000000",
            "stroke_width": 3,
            "background_color": "#000000",
            "background_opacity": 0.5,
            "highlight_color": "#FF6B6B",
            "shadow": False,
        },
        CaptionStyle.YOUTUBE_SHORTS: {
            "font": "Impact",
            "font_size": 56,
            "font_color": "#FFFFFF",
            "stroke_color": "#000000",
            "stroke_width": 5,
            "background_color": None,
            "highlight_color": "#FFD700",
            "shadow": True,
        },
        CaptionStyle.MINIMAL: {
            "font": "Arial",
            "font_size": 36,
            "font_color": "#FFFFFF",
            "stroke_color": "#333333",
            "stroke_width": 1,
            "background_color": None,
            "highlight_color": "#FFFFFF",
            "shadow": False,
        },
        CaptionStyle.BOLD: {
            "font": "Impact",
            "font_size": 64,
            "font_color": "#FFFF00",
            "stroke_color": "#000000",
            "stroke_width": 6,
            "background_color": None,
            "highlight_color": "#FF0000",
            "shadow": True,
        },
        CaptionStyle.NEON: {
            "font": "Arial",
            "font_size": 48,
            "font_color": "#00FFFF",
            "stroke_color": "#FF00FF",
            "stroke_width": 3,
            "background_color": None,
            "highlight_color": "#00FF00",
            "shadow": True,
        },
    }
    
    @classmethod
    def get_style(cls, config: CaptionConfig) -> dict:
        preset = cls.STYLE_PRESETS.get(config.style, cls.STYLE_PRESETS[CaptionStyle.TIKTOK]).copy()
        
        if config.font_size:
            preset["font_size"] = config.font_size
        if config.font_color:
            preset["font_color"] = config.font_color
        if config.stroke_color:
            preset["stroke_color"] = config.stroke_color
        if config.stroke_width is not None:
            preset["stroke_width"] = config.stroke_width
        if config.background_color:
            preset["background_color"] = config.background_color
        if config.highlight_color:
            preset["highlight_color"] = config.highlight_color
            
        return preset


class VideoProcessor:
    def __init__(self):
        self.settings = get_settings()
    
    async def extract_audio(self, video_path: Path, output_path: Path) -> Path:
        try:
            logger.info("extracting_audio", video_path=str(video_path))
            
            def _run_ffmpeg():
                (
                    ffmpeg
                    .input(str(video_path))
                    .output(str(output_path), acodec='pcm_s16le', ac=1, ar='16000')
                    .overwrite_output()
                    .run(capture_stdout=True, capture_stderr=True)
                )

            await asyncio.to_thread(_run_ffmpeg)
            
            logger.info("audio_extracted", output_path=str(output_path))
            return output_path
            
        except ffmpeg.Error as e:
            logger.error("audio_extraction_failed", error=e.stderr.decode() if e.stderr else str(e))
            raise VideoProcessingError(f"Failed to extract audio: {str(e)}")
    
    async def get_video_info(self, video_path: Path) -> dict:
        try:
            probe = ffmpeg.probe(str(video_path))
            video_stream = next(
                (s for s in probe['streams'] if s['codec_type'] == 'video'),
                None
            )
            
            if not video_stream:
                raise VideoProcessingError("No video stream found")
            
            return {
                "width": int(video_stream['width']),
                "height": int(video_stream['height']),
                "duration": float(probe['format'].get('duration', 0)),
                "fps": eval(video_stream.get('r_frame_rate', '30/1')),
            }
        except Exception as e:
            logger.error("video_probe_failed", error=str(e))
            raise VideoProcessingError(f"Failed to probe video: {str(e)}")
    
    
    async def generate_thumbnail(self, video_path: Path, output_path: Path, time: float = 0.0) -> Path:
        try:
            logger.info("generating_thumbnail", video_path=str(video_path))
            
            def _run_ffmpeg():
                (
                    ffmpeg
                    .input(str(video_path), ss=time)
                    .output(str(output_path), vframes=1)
                    .overwrite_output()
                    .run(capture_stdout=True, capture_stderr=True)
                )

            await asyncio.to_thread(_run_ffmpeg)
            
            if not output_path.exists():
                raise VideoProcessingError("Thumbnail file was not created")
                
            logger.info("thumbnail_generated", output_path=str(output_path))
            return output_path
            
        except ffmpeg.Error as e:
            logger.error("thumbnail_generation_failed", error=e.stderr.decode() if e.stderr else str(e))
            raise VideoProcessingError(f"Failed to generate thumbnail: {str(e)}")
        except Exception as e:
            logger.error("thumbnail_generation_failed", error=str(e))
            raise VideoProcessingError(f"Failed to generate thumbnail: {str(e)}")

    def _generate_ass_subtitle(
        self,
        transcription: Transcription,
        config: CaptionConfig,
        video_width: int,
        video_height: int
    ) -> str:
        style = CaptionStyler.get_style(config)
        
        font_color = style["font_color"].lstrip("#")
        font_color_ass = f"&H00{font_color[4:6]}{font_color[2:4]}{font_color[0:2]}"
        
        stroke_color = style["stroke_color"].lstrip("#")
        stroke_color_ass = f"&H00{stroke_color[4:6]}{stroke_color[2:4]}{stroke_color[0:2]}"
        
        highlight_color = style["highlight_color"].lstrip("#")
        highlight_color_ass = f"&H00{highlight_color[4:6]}{highlight_color[2:4]}{highlight_color[0:2]}"
        
        margin_v = 50
        if config.position == CaptionPosition.TOP:
            alignment = 8
            margin_v = 50
        elif config.position == CaptionPosition.CENTER:
            alignment = 5
            margin_v = 0
        else:
            alignment = 2
            margin_v = 80
        
        bold = 1 if config.font_weight in [FontWeight.BOLD, FontWeight.BLACK] else 0
        
        ass_content = f"""[Script Info]
Title: Video Captions
ScriptType: v4.00+
PlayResX: {video_width}
PlayResY: {video_height}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{style["font"]},{style["font_size"]},{font_color_ass},&H000000FF,{stroke_color_ass},&H80000000,{bold},0,0,0,100,100,0,0,1,{style["stroke_width"]},{1 if style.get("shadow") else 0},{alignment},20,20,{margin_v},1
Style: Highlight,{style["font"]},{style["font_size"]},{highlight_color_ass},&H000000FF,{stroke_color_ass},&H80000000,{bold},0,0,0,100,100,0,0,1,{style["stroke_width"]},{1 if style.get("shadow") else 0},{alignment},20,20,{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
        
        for segment in transcription.segments:
            # Only use word-level timing if words exist and highlight is enabled
            has_word_timing = config.highlight_current_word and segment.words and len(segment.words) > 0

            if has_word_timing:
                words = segment.words
                lines = self._split_into_lines(words, config.max_words_per_line)

                for line_words in lines:
                    if not line_words:
                        continue

                    line_start = line_words[0]["start"]
                    line_end = line_words[-1]["end"]

                    for i, word in enumerate(line_words):
                        word_start = word["start"]
                        word_end = word["end"]

                        text_parts = []
                        for j, w in enumerate(line_words):
                            if j == i:
                                text_parts.append(f"{{\\rHighlight}}{w['word']}{{\\rDefault}}")
                            else:
                                text_parts.append(w['word'])

                        text = " ".join(text_parts)

                        start_time = self._format_ass_time(word_start)
                        end_time = self._format_ass_time(word_end)

                        ass_content += f"Dialogue: 0,{start_time},{end_time},Default,,0,0,0,,{text}\n"
            else:
                # Use segment-level timing for edited captions or when word timing not available
                # Logic: Split text into lines based on max_words_per_line, and interpolate time for each line
                words = segment.text.split()
                if not words:
                    continue

                # Group words into chunks
                chunks = []
                for i in range(0, len(words), config.max_words_per_line):
                    chunks.append(words[i : i + config.max_words_per_line])

                num_chunks = len(chunks)
                if num_chunks == 0:
                    continue
                
                segment_duration = segment.end - segment.start
                chunk_duration = segment_duration / num_chunks
                
                for i, chunk_words in enumerate(chunks):
                    # Calculate start/end time for this chunk
                    chunk_start = segment.start + (i * chunk_duration)
                    chunk_end = chunk_start + chunk_duration
                    
                    # Logic: Interpolate word timings based on character length
                    full_text = " ".join(chunk_words)
                    total_chars = len(full_text.replace(" ", ""))
                    
                    if total_chars == 0:
                        # Fallback for empty/space-only lines
                        text = full_text
                    else:
                        # Distribute time proportionally to character length
                        text_parts = []
                        current_time = chunk_start
                        
                        for w_idx, w_text in enumerate(chunk_words):
                            w_len = len(w_text)
                            # Calculate duration for this word
                            # (word_len / total_chars) * total_duration
                            w_duration = (w_len / total_chars) * chunk_duration
                            
                            w_start = current_time
                            w_end = current_time + w_duration
                            current_time += w_duration # Advance time
                            
                            # Construct highlight tag
                            # Note: The loop for generating the line text needs to match the structure 
                            # of the "word timing" block above, but we are generating the *entire line's*
                            # karaoke tags here. 
                            # Actually, ASS karaoke requires a specific structure. 
                            # The loop above (lines 239-250) creates separate Dialogue events for EACH word highlight state?
                            # No, looking at lines 243-250, it iterates through words in the line, 
                            # and for each "i" (current word), it highlights THAT word.
                            # So we need to do the same here: For each word in the chunk, create a Dialogue line 
                            # where that word is highlighted.
                            
                            # Wait, this nested loop approach means if a line has 5 words, we generate 5 Dialogue lines 
                            # that overlap in time? 
                            # Let's check the original logic at lines 255:
                            # ass_content += f"Dialogue: 0,{start_time},{end_time},..."
                            # AND start_time/end_time are specific to that WORD.
                            # Ah! The original logic (lines 240-255) creates a Dialogue entry for the duration of a SINGLE WORD.
                            # And in that entry, it shows the FULL LINE, but with the specific word highlighted.
                            # So: Time = Word Start to Word End. Text = Full Line with specific word highlighted.
                            
                            # So for our interpolation:
                            # We need to iterate through words in this chunk.
                            # For each word, define its specific start/end time.
                            # Create a dialogue entry for THAT time range.
                            # In that entry, verify the text has the correct highlighting tags.
                            pass
                        
                        # Re-implementing the loop with correct logic
                        current_word_start = chunk_start
                        
                        for w_idx, w_text in enumerate(chunk_words):
                            w_len = len(w_text)
                            w_duration = (w_len / total_chars) * chunk_duration
                            w_end = current_word_start + w_duration
                            
                            # Construct text with highlight for THIS word
                            line_text_parts = []
                            for target_idx, target_word in enumerate(chunk_words):
                                if target_idx == w_idx:
                                    line_text_parts.append(f"{{\\rHighlight}}{target_word}{{\\rDefault}}")
                                else:
                                    line_text_parts.append(target_word)
                            
                            text = " ".join(line_text_parts)
                            
                            start_time = self._format_ass_time(current_word_start)
                            end_time = self._format_ass_time(w_end)
                             
                            ass_content += f"Dialogue: 0,{start_time},{end_time},Default,,0,0,0,,{text}\n"
                            
                            current_word_start = w_end # Next word starts when this one ends
        
        return ass_content
    
    def _split_into_lines(self, words: List[dict], max_words: int) -> List[List[dict]]:
        lines = []
        current_line = []
        
        for word in words:
            current_line.append(word)
            if len(current_line) >= max_words:
                lines.append(current_line)
                current_line = []
        
        if current_line:
            lines.append(current_line)
        
        return lines
    
    def _split_text_into_lines(self, text: str, max_words: int) -> List[str]:
        words = text.split()
        lines = []
        
        for i in range(0, len(words), max_words):
            lines.append(" ".join(words[i:i + max_words]))
        
        return lines
    
    def _format_ass_time(self, seconds: float) -> str:
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        centisecs = int((seconds % 1) * 100)
        return f"{hours}:{minutes:02d}:{secs:02d}.{centisecs:02d}"
    
    async def add_captions(
        self,
        video_path: Path,
        output_path: Path,
        transcription: Transcription,
        config: CaptionConfig,
        progress_callback=None
    ) -> Path:
        try:
            logger.info("adding_captions", video_path=str(video_path))
            
            video_info = await self.get_video_info(video_path)
            
            ass_content = self._generate_ass_subtitle(
                transcription,
                config,
                video_info["width"],
                video_info["height"]
            )
            
            ass_path = video_path.parent / f"{video_path.stem}_captions.ass"
            with open(ass_path, "w", encoding="utf-8") as f:
                f.write(ass_content)
            
            logger.info("subtitle_file_created", ass_path=str(ass_path))
            
            ass_path_escaped = str(ass_path).replace("\\", "/").replace(":", "\\:")

            cmd = [
                "ffmpeg",
                "-i", str(video_path),
                "-vf", f"ass='{ass_path_escaped}'",
                "-c:v", "libx264",
                "-profile:v", "high",
                "-level", "4.0",
                "-crf", "23",
                "-pix_fmt", "yuv420p",
                "-c:a", "copy",
                "-movflags", "+faststart",
                "-y",
                str(output_path)
            ]
            
            def _run_ffmpeg_cmd():
                process = subprocess.Popen(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    universal_newlines=True
                )
                return process.communicate(), process.returncode

            (stdout, stderr), returncode = await asyncio.to_thread(_run_ffmpeg_cmd)

            if returncode != 0:
                logger.error(
                    "ffmpeg_failed",
                    returncode=process.returncode,
                    stderr=stderr,
                    stdout=stdout
                )
                raise VideoProcessingError(f"FFmpeg failed: {stderr}")

            if not Path(output_path).exists():
                logger.error("output_file_not_created", output_path=str(output_path))
                raise VideoProcessingError(f"Output video file was not created: {output_path}")

            if ass_path.exists():
                ass_path.unlink()

            logger.info("captions_added", output_path=str(output_path))
            return output_path

        except Exception as e:
            logger.error("caption_rendering_failed", error=str(e), video_path=str(video_path))
            raise VideoProcessingError(f"Failed to add captions: {str(e)}")


_video_processor: Optional[VideoProcessor] = None


def get_video_processor() -> VideoProcessor:
    global _video_processor
    if _video_processor is None:
        _video_processor = VideoProcessor()
    return _video_processor
