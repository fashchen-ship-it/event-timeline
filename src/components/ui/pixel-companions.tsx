import Image from "next/image";

export function PixelCompanionShelf() {
  return (
    <aside aria-label="今日陪伴" className="pixel-companion-shelf">
      <div className="pixel-companion-copy">
        <p className="pixel-eyebrow">TODAY · COMPANIONS</p>
        <p className="pixel-companion-title">把小事放进日记里，慢慢就会长成一条事线。</p>
        <div aria-label="当前可用的记录标签" className="pixel-companion-labels">
          <span className="pixel-label-sticker pixel-label-sticker-sage">正在记录</span>
          <span className="pixel-label-sticker pixel-label-sticker-wheat">慢慢整理</span>
          <span className="pixel-label-sticker pixel-label-sticker-sky">留给以后看</span>
        </div>
      </div>
      <div aria-hidden="true" className="pixel-companion-art">
        <Image alt="" className="pixel-companion-cat" height={1280} src="/companions/tabby-logbook-clean.png" width={1280} />
        <Image alt="" className="pixel-companion-dog" height={1280} src="/companions/poodle-note.png" width={1280} />
      </div>
    </aside>
  );
}
