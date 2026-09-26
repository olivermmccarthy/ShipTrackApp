export default function TruckLoader() {
  return (
    <div className="loader-wrapper" aria-hidden="true">
      <svg
        className="truck-svg"
        viewBox="0 0 200 120"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g className="motion-lines">
          <line x1="8" y1="42" x2="-4" y2="42" />
          <line x1="4" y1="54" x2="-10" y2="54" />
        </g>

        <g className="truck-outline">
          <rect x="15" y="30" width="95" height="55" rx="4" />
          <path d="M110 85 L110 50 L128 50 L145 68 L145 85 Z" />
          <line x1="110" y1="63" x2="128" y2="63" />
        </g>

        <g className="wheel wheel-back">
          <circle cx="45" cy="88" r="13" />
          <line x1="45" y1="88" x2="45" y2="77" />
        </g>
        <g className="wheel wheel-front">
          <circle cx="125" cy="88" r="13" />
          <line x1="125" y1="88" x2="125" y2="77" />
        </g>

        <line className="ground-line" x1="0" y1="101" x2="170" y2="101" />
      </svg>
    </div>
  );
}
