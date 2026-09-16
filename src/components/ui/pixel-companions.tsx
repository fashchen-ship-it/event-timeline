import Image from "next/image";
import Link from "next/link";
import { PixelIcon, type PixelIconName } from "@/components/ui/pixel";
import type { EventCollection } from "@/lib/events/types";

function collectionEmblem(name: string): PixelIconName {
  const text = name.toLowerCase();
  if (/工作|公司|项目|职业|office|work/.test(text)) return "briefcase";
  if (/学习|读书|课程|考试|学校|study/.test(text)) return "study";
  if (/旅行|出行|出游|旅|trip|travel/.test(text)) return "map";
  if (/健康|运动|健身|医疗|health|sport/.test(text)) return "leaf";
  if (/家人|生活|宠物|朋友|情感|home|life/.test(text)) return "heart";
  if (/钱|财|账|投资|finance|money/.test(text)) return "coin";
  return "sprout";
}

export function PixelCompanionShelf({ collections }: { collections: EventCollection[] }) {
  return (
    <aside aria-label="今日陪伴" className="pixel-companion-shelf">
      <div className="pixel-companion-copy">
        <p className="pixel-eyebrow">TODAY · COMPANIONS</p>
        <p className="pixel-companion-title">把正在发生的事，收进自己的记录册。</p>
        <div aria-label="事件分类快捷入口" className="pixel-companion-labels">
          {collections.length ? collections.slice(0, 4).map((collection) => <Link className="pixel-category-sticker" href={`/events?collection=${collection.id}`} key={collection.id} style={{ backgroundColor: `${collection.color}24`, borderColor: `${collection.color}88`, color: collection.color }}><PixelIcon className="size-3.5" name={collectionEmblem(collection.name)} />{collection.name}</Link>) : <span className="pixel-label-sticker pixel-label-sticker-sage">新建事件时可添加分类</span>}
        </div>
      </div>
      <div aria-hidden="true" className="pixel-companion-art">
        <Image alt="" className="pixel-companion-cat" height={1280} src="/companions/tabby-logbook-clean.png" width={1280} />
        <Image alt="" className="pixel-companion-dog" height={1280} src="/companions/poodle-note.png" width={1280} />
      </div>
    </aside>
  );
}
