import {
  BookOpenText,
  FileClock,
  LayoutDashboard,
  RadioTower,
} from "lucide-react";

export function Sidebar() {
  return (
    <aside className="sidebar">
      <a className="brand" href="#top" aria-label="RE:SEARCH 홈">
        <span>RE:</span>SEARCH
      </a>
      <nav aria-label="주요 메뉴">
        <a className="active" href="#dashboard">
          <LayoutDashboard size={18} />
          <span>대시보드</span>
        </a>
        <a href="#logs">
          <FileClock size={18} />
          <span>연구 기록</span>
        </a>
        <a href="#literature">
          <BookOpenText size={18} />
          <span>문헌 지도</span>
        </a>
      </nav>
      <div className="sidebar-status">
        <RadioTower size={17} />
        <div>
          <strong>Local Lab</strong>
          <span>Docker 연결</span>
        </div>
      </div>
    </aside>
  );
}
