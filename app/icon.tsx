import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
      }}
    >
      <svg width="24" height="24" viewBox="0 0 800 800" fill="none">
        {/* Top */}
        <path
          fill="#000000"
          d="
              M200 55
              H600
              A100 100 0 0 1 700 155
              V300
              H540
              V425
              A15 15 0 0 1 525 440
              H495
              A15 15 0 0 1 480 425
              V300
              H320
              V425
              A15 15 0 0 1 305 440
              H275
              A15 15 0 0 1 260 425
              V300
              H100
              V155
              A100 100 0 0 1 200 55
              Z"
        />

        {/* Bottom */}
        <path
          fill="#000000"
          d="
              M100 500
              H700
              V645
              A100 100 0 0 1 600 745
              H200
              A100 100 0 0 1 100 645
              Z"
        />
      </svg>
    </div>,
    { ...size },
  );
}
