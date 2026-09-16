import Image from "next/image";

export function PixelHeaderCompanions() {
  return (
    <div aria-hidden="true" className="pixel-header-companions">
      <div className="pixel-header-companions-art">
        <Image alt="" className="pixel-companion-cat" height={1280} sizes="(max-width: 639px) 5rem, 6rem" src="/companions/tabby-logbook-clean.png" width={1280} />
        <Image alt="" className="pixel-companion-dog" height={1280} sizes="(max-width: 639px) 4.6rem, 5.5rem" src="/companions/poodle-note.png" width={1280} />
      </div>
    </div>
  );
}
