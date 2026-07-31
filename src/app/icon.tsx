import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#f7f6f2",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            alignItems: "center",
            background: "#8a7968",
            borderRadius: 112,
            color: "#fffdf9",
            display: "flex",
            fontSize: 220,
            fontWeight: 700,
            height: 384,
            justifyContent: "center",
            width: 384,
          }}
        >
          线
        </div>
      </div>
    ),
    size,
  );
}
