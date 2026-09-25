export default function TruckLoader() {
  return (
    <div className="loader-wrapper" aria-hidden="true">
      <svg
        className="truck-svg"
        viewBox="0 0 200 180"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Animated Exhaust / Speed Lines */}
        <g className="exhaust-lines">
          <rect
            x="0"
            y="115"
            width="25"
            height="8"
            rx="4"
            fill="#DC3545"
            className="exhaust-line"
          />
          <rect
            x="-15"
            y="132"
            width="35"
            height="8"
            rx="4"
            fill="#DC3545"
            className="exhaust-line"
          />
        </g>

        {/* Main Truck Body (Bounces) */}
        <g className="truck-body">
          {/* Location Pin */}
          <path
            d="M65 25 c14 0 25 11 25 25 c0 18 -25 45 -25 45 c0 0 -25 -27 -25 -45 c0 -14 11 -25 25 -25 z"
            fill="#DC3545"
          />
          <circle cx="65" cy="50" r="10" fill="#FFFFFF" />

          {/* Yellow Cargo Box */}
          <rect x="20" y="70" width="90" height="75" rx="6" fill="#FFC107" />

          {/* Red Cab */}
          <path d="M110 85 h20 l18 30 v30 h-38 v-60 z" fill="#DC3545" />

          {/* Light Blue Window */}
          <polygon points="112,92 124,92 136,112 112,112" fill="#B3E5FC" />

          {/* Light Grey Chassis Base */}
          <rect x="15" y="142" width="145" height="8" rx="4" fill="#E0E0E0" />
          <rect x="150" y="135" width="10" height="15" rx="3" fill="#FFC107" />
        </g>

        {/* Wheels (Spin independently) */}
        <g className="wheel wheel-back">
          <circle cx="50" cy="150" r="16" fill="#212121" />
          <circle cx="50" cy="150" r="6" fill="#E0E0E0" />
          <circle cx="58" cy="150" r="2.5" fill="#9E9E9E" />
        </g>
        <g className="wheel wheel-front">
          <circle cx="135" cy="150" r="16" fill="#212121" />
          <circle cx="135" cy="150" r="6" fill="#E0E0E0" />
          <circle cx="143" cy="150" r="2.5" fill="#9E9E9E" />
        </g>
      </svg>
    </div>
  );
}
