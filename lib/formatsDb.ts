// src/lib/formatsDb.ts
// 실제 Supabase `study_types` 테이블(code/label)을 FormatPicker가 쓰는
// { id, label, blurb } 목록으로 바꿔주는 공용 헬퍼.
// (code = 화면에 굵게 뜨는 짧은 이름, label = 그 아래 작은 설명 문구.
//  study_types 테이블 만들 때 확인한 매핑 그대로입니다.)
//
// 표시 순서: study_types에는 아직 순서 컬럼이 없어서, 지금 화면에 보이는
// 순서(Test Prep → Interview Prep → Project → Study → Discussion)를
// 그대로 유지하려고 여기서 고정 순서로 정렬합니다. DB에 이 순서에 없는
// code가 새로 생기면 맨 뒤에 붙습니다.
// ▶ 나중에 순서를 DB에서 직접 관리하고 싶으면 study_types에 sort_order
//   같은 정수 컬럼을 추가하고 여기서 그 값으로 정렬하면 됩니다.

import { supabase } from "./supabase";
import type { FormatId } from "./types";

const DISPLAY_ORDER = ["Test Prep", "Interview Prep", "Project", "Study", "Discussion"];

export interface FormatOption {
  id: FormatId;
  label: string;
  blurb: string;
}

export async function fetchFormatsFromDb(): Promise<FormatOption[]> {
  const { data, error } = await supabase.from("study_types").select("code, label");

  if (error) throw error;

  const rows: FormatOption[] = (data ?? [])
    .filter((r): r is { code: string; label: string } => Boolean(r.code))
    .map((r) => ({
      id: r.code as FormatId,
      label: r.code,
      blurb: r.label ?? "",
    }));

  rows.sort((a, b) => {
    const ai = DISPLAY_ORDER.indexOf(a.id);
    const bi = DISPLAY_ORDER.indexOf(b.id);
    return (ai === -1 ? DISPLAY_ORDER.length : ai) - (bi === -1 ? DISPLAY_ORDER.length : bi);
  });

  return rows;
}
