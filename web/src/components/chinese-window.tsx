interface ChineseWindowProps {
  className?: string;
}

export function ChineseWindow({ className = "" }: ChineseWindowProps) {
  return (
    <svg viewBox="0 0 300 300" fill="none" className={className}>
      <defs>
        <clipPath id="windowClip">
          <path d="M150 8 C185 8 210 30 220 55 C230 80 248 95 260 105 C272 115 292 130 292 150 C292 170 272 185 260 195 C248 205 230 220 220 245 C210 270 185 292 150 292 C115 292 90 270 80 245 C70 220 52 205 40 195 C28 185 8 170 8 150 C8 130 28 115 40 105 C52 95 70 80 80 55 C90 30 115 8 150 8Z" />
        </clipPath>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0e8d8" />
          <stop offset="60%" stopColor="#e8ddd0" />
          <stop offset="100%" stopColor="#ddd0c0" />
        </linearGradient>
        <linearGradient id="mountainGrad1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b8a898" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#c8b8a8" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="mountainGrad2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8a7a6a" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#a89888" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="mountainGrad3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6a5a4a" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#8a7a6a" stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {/* Window outer frame - quadrilobe shape */}
      <path
        d="M150 12 C182 12 206 32 215 55 C224 78 240 92 252 102 C264 112 280 126 280 150 C280 174 264 188 252 198 C240 208 224 222 215 245 C206 268 182 288 150 288 C118 288 94 268 85 245 C76 222 60 208 48 198 C36 188 20 174 20 150 C20 126 36 112 48 102 C60 92 76 78 85 55 C94 32 118 12 150 12Z"
        stroke="#c4835a"
        strokeWidth="1.5"
        opacity="0.6"
        fill="none"
      />

      {/* Inner decorative ring */}
      <path
        d="M150 22 C177 22 198 38 206 58 C214 78 228 90 238 100 C248 110 262 124 262 150 C262 176 248 190 238 200 C228 210 214 222 206 242 C198 262 177 278 150 278 C123 278 102 262 94 242 C86 222 72 210 62 200 C52 190 38 176 38 150 C38 124 52 110 62 100 C72 90 86 78 94 58 C102 38 123 22 150 22Z"
        stroke="#c4835a"
        strokeWidth="0.5"
        opacity="0.3"
        fill="none"
      />

      {/* Landscape painting inside window */}
      <g clipPath="url(#windowClip)">
        {/* Sky/background */}
        <rect x="8" y="8" width="284" height="284" fill="url(#skyGrad)" />

        {/* Distant mountains */}
        <path
          d="M8 170 Q60 100 100 140 Q130 110 160 130 Q180 115 200 125 Q240 100 292 150 L292 200 L8 200Z"
          fill="url(#mountainGrad1)"
        />
        <path
          d="M8 185 Q50 135 90 155 Q120 130 150 148 Q180 135 210 148 Q250 130 292 165 L292 210 L8 210Z"
          fill="url(#mountainGrad2)"
        />

        {/* Mid mountains */}
        <path
          d="M8 200 Q60 155 110 170 Q140 150 175 165 Q210 150 250 168 Q270 160 292 175 L292 220 L8 220Z"
          fill="url(#mountainGrad3)"
        />

        {/* Moon/sun disc */}
        <circle cx="220" cy="85" r="18" fill="#d4c0a8" opacity="0.3" />
        <circle cx="220" cy="85" r="14" fill="#e0d0b8" opacity="0.25" />

        {/* Pavillion / 亭台 */}
        <g opacity="0.5">
          {/* Base */}
          <rect x="128" y="175" width="44" height="4" rx="1" fill="#6a5a4a" />
          {/* Pillars */}
          <rect x="132" y="150" width="3" height="25" fill="#7a6a5a" />
          <rect x="165" y="150" width="3" height="25" fill="#7a6a5a" />
          {/* Roof */}
          <path d="M124 150 L150 135 L176 150Z" fill="#8a7a6a" />
          <path d="M128 150 L150 138 L172 150Z" fill="#7a6a5a" />
          {/* Roof curve tips */}
          <path d="M124 150 Q120 147 122 144" stroke="#8a7a6a" strokeWidth="0.8" fill="none" />
          <path d="M176 150 Q180 147 178 144" stroke="#8a7a6a" strokeWidth="0.8" fill="none" />
        </g>

        {/* Pine tree - left */}
        <g opacity="0.45">
          <path d="M60 185 L60 150" stroke="#5a6a4a" strokeWidth="1.5" />
          <path d="M60 155 Q45 148 42 155 Q48 150 60 155" fill="#6a7a5a" opacity="0.6" />
          <path d="M60 160 Q50 155 46 162 Q52 157 60 160" fill="#6a7a5a" opacity="0.5" />
          <path d="M60 165 Q52 160 48 167 Q54 162 60 165" fill="#6a7a5a" opacity="0.4" />
        </g>

        {/* Pine tree - right */}
        <g opacity="0.4">
          <path d="M230 190 L230 160" stroke="#5a6a4a" strokeWidth="1.2" />
          <path d="M230 165 Q220 160 218 167 Q224 162 230 165" fill="#6a7a5a" opacity="0.5" />
          <path d="M230 170 Q222 166 220 172 Q226 168 230 170" fill="#6a7a5a" opacity="0.4" />
        </g>

        {/* Mist / clouds */}
        <path
          d="M30 190 Q60 182 90 190 Q110 185 130 192 Q160 182 190 190 Q210 184 230 190 Q260 182 280 190"
          stroke="#d8ccc0"
          strokeWidth="2"
          opacity="0.3"
          fill="none"
        />
        <path
          d="M50 198 Q80 192 110 198 Q140 190 170 198 Q200 192 240 198 Q260 194 280 200"
          stroke="#d8ccc0"
          strokeWidth="1.5"
          opacity="0.2"
          fill="none"
        />

        {/* Ground / shore */}
        <path
          d="M8 210 Q80 200 150 210 Q200 215 250 208 Q270 212 292 210 L292 240 L8 240Z"
          fill="#d0c0a8"
          opacity="0.3"
        />

        {/* Small boat */}
        <g opacity="0.35">
          <path d="M90 200 Q95 196 100 200 Q97 202 93 202Z" fill="#7a6a5a" stroke="#7a6a5a" strokeWidth="0.3" />
          <line x1="95" y1="196" x2="95" y2="190" stroke="#7a6a5a" strokeWidth="0.4" />
        </g>

        {/* Flying birds */}
        <g opacity="0.2">
          <path d="M170 100 Q173 97 176 100 Q179 97 182 100" stroke="#6a5a4a" strokeWidth="0.5" fill="none" />
          <path d="M185 108 Q188 105 191 108 Q194 105 197 108" stroke="#6a5a4a" strokeWidth="0.4" fill="none" />
          <path d="M160 112 Q162 110 164 112 Q166 110 168 112" stroke="#6a5a4a" strokeWidth="0.3" fill="none" />
        </g>

        {/* Peach blossom branch - right side */}
        <g opacity="0.35">
          <path d="M240 130 Q255 118 265 108 Q270 104 272 100" stroke="#7a5a4a" strokeWidth="1" fill="none" />
          <circle cx="260" cy="112" r="2.5" fill="#d4a0a0" opacity="0.6" />
          <circle cx="268" cy="105" r="2" fill="#d4a0a0" opacity="0.5" />
          <circle cx="254" cy="116" r="1.8" fill="#d4a0a0" opacity="0.4" />
          <circle cx="264" cy="108" r="1.5" fill="#e0b0b0" opacity="0.3" />
        </g>
      </g>

      {/* Corner decorative clouds on window frame */}
      <g opacity="0.15">
        <path d="M35 45 Q42 38 50 42 Q55 36 62 42 Q68 38 74 45" stroke="#c4835a" strokeWidth="0.6" fill="none" />
        <path d="M226 45 Q232 38 240 42 Q245 36 252 42 Q258 38 264 45" stroke="#c4835a" strokeWidth="0.6" fill="none" />
        <path d="M35 255 Q42 248 50 252 Q55 246 62 252 Q68 248 74 255" stroke="#c4835a" strokeWidth="0.6" fill="none" />
        <path d="M226 255 Q232 248 240 252 Q245 246 252 252 Q258 248 264 255" stroke="#c4835a" strokeWidth="0.6" fill="none" />
      </g>
    </svg>
  );
}
