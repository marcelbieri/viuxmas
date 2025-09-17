interface GlowEffectProps {
  size: "small" | "medium" | "large" | "xlarge"
}

export function GlowEffect({ size }: GlowEffectProps) {
  const getSizeClasses = () => {
    switch (size) {
      case "small":
        return "w-20 h-20 lg:w-24 lg:h-24"
      case "medium":
        return "w-28 h-28 lg:w-36 lg:h-36"
      case "large":
        return "w-36 h-36 lg:w-44 lg:h-44"
      case "xlarge":
        return "w-44 h-44 lg:w-52 lg:h-52"
    }
  }

  return (
    <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${getSizeClasses()}`}>
      <svg viewBox="0 0 370 370" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full animate-pulse">
        <g filter="url(#filter0_ng_1976_1029)">
          <circle cx="185" cy="185" r="120" fill="white" fillOpacity="0.3" />
        </g>
        <defs>
          <filter
            id="filter0_ng_1976_1029"
            x="0"
            y="0"
            width="370"
            height="370"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.43478262424468994 0.43478262424468994"
              stitchTiles="stitch"
              numOctaves="3"
              result="noise"
              seed="2613"
            />
            <feColorMatrix in="noise" type="luminanceToAlpha" result="alphaNoise" />
            <feComponentTransfer in="alphaNoise" result="coloredNoise1">
              <feFuncA
                type="discrete"
                tableValues="0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 "
              />
            </feComponentTransfer>
            <feComposite operator="in" in2="shape" in="coloredNoise1" result="noise1Clipped" />
            <feFlood floodColor="rgba(0, 0, 0, 0.25)" result="color1Flood" />
            <feComposite operator="in" in2="noise1Clipped" in="color1Flood" result="color1" />
            <feMerge result="effect1_noise_1976_1029">
              <feMergeNode in="shape" />
              <feMergeNode in="color1" />
            </feMerge>
            <feTurbulence type="fractalNoise" baseFrequency="1 1" numOctaves="3" seed="6322" />
            <feDisplacementMap
              in="effect1_noise_1976_1029"
              scale="130"
              xChannelSelector="R"
              yChannelSelector="G"
              result="displacedImage"
              width="100%"
              height="100%"
            />
            <feMerge result="effect2_texture_1976_1029">
              <feMergeNode in="displacedImage" />
            </feMerge>
          </filter>
        </defs>
      </svg>
    </div>
  )
}
