package com.adityachandel.booklore.model.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EpubViewerPreferences {
    private Long bookId;
    private String theme;
    private String font;
    private String flow;
    private String spread;
    private Integer fontSize;
    private Float letterSpacing;
    private Float lineHeight;
    @Min(0)
    @Max(35)
    private Float margin;
    private Long customFontId;
}