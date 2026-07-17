"use client";

import { MessageSquareText } from "lucide-react";

export function WritingBrief({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <section className="writing-brief" aria-labelledby="writing-brief-title">
      <MessageSquareText aria-hidden="true" size={19} />
      <div className="writing-brief-copy">
        <strong id="writing-brief-title">논문 작성 지시</strong>
        <span>분량·논증 범위·비교 대상·원하는 문체를 자유롭게 적어주세요.</span>
      </div>
      <textarea
        aria-label="논문 작성 지시"
        value={value}
        maxLength={5000}
        onChange={(event) => onChange(event.target.value)}
        placeholder="예: A4 20쪽 내외. 국내 스포츠 승부예측 규제와 영국·미국 입법례를 비교하고, 본론에서 인터뷰 결과를 독립 절로 분석. 과장된 표현 없이 법학 논문 문체로 작성."
      />
    </section>
  );
}
