// The Buoyancis Decoder - Mapping letters to conceptual totems
// Each letter carries semantic weight in the Buoyancis system

export type Language = "en" | "zh" | "ja" | "ko";

export interface DecodedLetter {
  letter: string;
  concept: string;
  conceptZh: string;
  conceptJa: string;
  conceptKo: string;
  code: string;
  description: string;
  descriptionZh: string;
  descriptionJa: string;
  descriptionKo: string;
}

// Primary letter-to-concept mapping based on Buoyancis theory
const LETTER_MAP: Record<string, { 
  concept: string; 
  conceptZh: string; 
  conceptJa: string; 
  conceptKo: string; 
  code: string; 
  description: string; 
  descriptionZh: string; 
  descriptionJa: string; 
  descriptionKo: string; 
}> = {
  // Core structural codes
  A: { concept: "Asset", conceptZh: "資產", conceptJa: "資産", conceptKo: "자산", code: "A", description: "Accumulation of value", descriptionZh: "價值的累積", descriptionJa: "価値の蓄積", descriptionKo: "가치의 축적" },
  B: { concept: "Birth", conceptZh: "誕生", conceptJa: "誕生", conceptKo: "탄생", code: "B", description: "Origin point, genesis", descriptionZh: "起源點，創世", descriptionJa: "起源点、創世", descriptionKo: "기원점, 창세" },
  C: { concept: "Care", conceptZh: "關懷", conceptJa: "配慮", conceptKo: "배려", code: "C", description: "Consensus and nurturing", descriptionZh: "共識與培育", descriptionJa: "合意と育成", descriptionKo: "합의와 양육" },
  D: { concept: "Duty", conceptZh: "責任", conceptJa: "義務", conceptKo: "의무", code: "D", description: "Obligation and responsibility", descriptionZh: "義務與責任", descriptionJa: "義務と責任", descriptionKo: "의무와 책임" },
  E: { concept: "Energy", conceptZh: "能量", conceptJa: "エネルギー", conceptKo: "에너지", code: "E", description: "Force and momentum", descriptionZh: "力量與動力", descriptionJa: "力と勢い", descriptionKo: "힘과 추진력" },
  F: { concept: "Flow", conceptZh: "流動", conceptJa: "流れ", conceptKo: "흐름", code: "F", description: "Movement and continuity", descriptionZh: "運動與連續性", descriptionJa: "動きと連続性", descriptionKo: "움직임과 연속성" },
  G: { concept: "Growth", conceptZh: "成長", conceptJa: "成長", conceptKo: "성장", code: "G", description: "Expansion and development", descriptionZh: "擴張與發展", descriptionJa: "拡大と発展", descriptionKo: "확장과 발전" },
  H: { concept: "Harmony", conceptZh: "和諧", conceptJa: "調和", conceptKo: "조화", code: "H", description: "Balance and integration", descriptionZh: "平衡與整合", descriptionJa: "バランスと統合", descriptionKo: "균형과 통합" },
  I: { concept: "Integration", conceptZh: "整合", conceptJa: "統合", conceptKo: "통합", code: "I", description: "Synthesis and unification", descriptionZh: "綜合與統一", descriptionJa: "統合と統一", descriptionKo: "종합과 통일" },
  J: { concept: "Justice", conceptZh: "正義", conceptJa: "正義", conceptKo: "정의", code: "J", description: "Fairness and equilibrium", descriptionZh: "公平與均衡", descriptionJa: "公正と均衡", descriptionKo: "공정과 균형" },
  K: { concept: "Knowledge", conceptZh: "知識", conceptJa: "知識", conceptKo: "지식", code: "K", description: "Understanding and wisdom", descriptionZh: "理解與智慧", descriptionJa: "理解と知恵", descriptionKo: "이해와 지혜" },
  L: { concept: "Leisure", conceptZh: "休閒", conceptJa: "余暇", conceptKo: "여가", code: "L", description: "Rest and restoration", descriptionZh: "休息與恢復", descriptionJa: "休息と回復", descriptionKo: "휴식과 회복" },
  M: { concept: "Matter", conceptZh: "物質", conceptJa: "物質", conceptKo: "물질", code: "M", description: "Substance and material", descriptionZh: "物質與材料", descriptionJa: "物質と素材", descriptionKo: "물질과 재료" },
  N: { concept: "Network", conceptZh: "網絡", conceptJa: "ネットワーク", conceptKo: "네트워크", code: "N", description: "Connection and links", descriptionZh: "連接與聯繫", descriptionJa: "接続とリンク", descriptionKo: "연결과 링크" },
  O: { concept: "Order", conceptZh: "秩序", conceptJa: "秩序", conceptKo: "질서", code: "O", description: "Structure and arrangement", descriptionZh: "結構與安排", descriptionJa: "構造と配置", descriptionKo: "구조와 배열" },
  P: { concept: "Power", conceptZh: "權力", conceptJa: "権力", conceptKo: "권력", code: "P", description: "Authority and influence", descriptionZh: "權威與影響", descriptionJa: "権威と影響", descriptionKo: "권위와 영향력" },
  Q: { concept: "Quest", conceptZh: "探索", conceptJa: "探求", conceptKo: "탐구", code: "Q", description: "Search and inquiry", descriptionZh: "搜尋與探究", descriptionJa: "探索と探究", descriptionKo: "탐색과 탐구" },
  R: { concept: "Resource", conceptZh: "資源", conceptJa: "資源", conceptKo: "자원", code: "R", description: "Supply and provision", descriptionZh: "供應與供給", descriptionJa: "供給と提供", descriptionKo: "공급과 제공" },
  S: { concept: "Service", conceptZh: "服務", conceptJa: "サービス", conceptKo: "서비스", code: "S", description: "Assistance and support", descriptionZh: "協助與支持", descriptionJa: "支援とサポート", descriptionKo: "지원과 서포트" },
  T: { concept: "Technology", conceptZh: "技術", conceptJa: "技術", conceptKo: "기술", code: "T", description: "Tools and systems", descriptionZh: "工具與系統", descriptionJa: "ツールとシステム", descriptionKo: "도구와 시스템" },
  U: { concept: "Unity", conceptZh: "團結", conceptJa: "団結", conceptKo: "단결", code: "U", description: "Cohesion and togetherness", descriptionZh: "凝聚與合作", descriptionJa: "結束と協力", descriptionKo: "응집과 협력" },
  V: { concept: "Value", conceptZh: "價值", conceptJa: "価値", conceptKo: "가치", code: "V", description: "Worth and significance", descriptionZh: "價值與意義", descriptionJa: "価値と意義", descriptionKo: "가치와 의의" },
  W: { concept: "Wisdom", conceptZh: "智慧", conceptJa: "知恵", conceptKo: "지혜", code: "W", description: "Deep understanding", descriptionZh: "深刻的理解", descriptionJa: "深い理解", descriptionKo: "깊은 이해" },
  X: { concept: "Exchange", conceptZh: "交換", conceptJa: "交換", conceptKo: "교환", code: "X", description: "Trade and transformation", descriptionZh: "交易與轉化", descriptionJa: "取引と変換", descriptionKo: "거래와 변환" },
  Y: { concept: "Yield", conceptZh: "產出", conceptJa: "産出", conceptKo: "산출", code: "Y", description: "Output and production", descriptionZh: "輸出與生產", descriptionJa: "出力と生産", descriptionKo: "출력과 생산" },
  Z: { concept: "Zero", conceptZh: "歸零", conceptJa: "ゼロ", conceptKo: "영점", code: "Z", description: "Void and potential", descriptionZh: "虛空與潛能", descriptionJa: "虚空と可能性", descriptionKo: "허공과 잠재력" },
  
  // Numeric codes
  "0": { concept: "Void", conceptZh: "虛空", conceptJa: "虚空", conceptKo: "허공", code: "0", description: "Emptiness, potential", descriptionZh: "空無，潛力", descriptionJa: "空虚、可能性", descriptionKo: "공허, 잠재력" },
  "1": { concept: "Authority", conceptZh: "權威", conceptJa: "権威", conceptKo: "권위", code: "1", description: "Leadership, singularity", descriptionZh: "領導，獨特性", descriptionJa: "リーダーシップ、独自性", descriptionKo: "리더십, 독자성" },
  "2": { concept: "Duality", conceptZh: "二元", conceptJa: "二元性", conceptKo: "이원성", code: "2", description: "Balance, partnership", descriptionZh: "平衡，夥伴關係", descriptionJa: "バランス、パートナーシップ", descriptionKo: "균형, 파트너십" },
  "3": { concept: "Creation", conceptZh: "創造", conceptJa: "創造", conceptKo: "창조", code: "3", description: "Synthesis, birth", descriptionZh: "綜合，誕生", descriptionJa: "統合、誕生", descriptionKo: "종합, 탄생" },
  "4": { concept: "Foundation", conceptZh: "基礎", conceptJa: "基盤", conceptKo: "기반", code: "4", description: "Stability, structure", descriptionZh: "穩定，結構", descriptionJa: "安定、構造", descriptionKo: "안정, 구조" },
  "5": { concept: "Change", conceptZh: "變化", conceptJa: "変化", conceptKo: "변화", code: "5", description: "Transformation, flux", descriptionZh: "轉變，流動", descriptionJa: "変容、流動", descriptionKo: "변용, 유동" },
  "6": { concept: "Harmony", conceptZh: "和諧", conceptJa: "調和", conceptKo: "조화", code: "6", description: "Balance, beauty", descriptionZh: "平衡，美麗", descriptionJa: "バランス、美", descriptionKo: "균형, 아름다움" },
  "7": { concept: "Mystery", conceptZh: "神秘", conceptJa: "神秘", conceptKo: "신비", code: "7", description: "Hidden knowledge", descriptionZh: "隱藏的知識", descriptionJa: "隠された知識", descriptionKo: "숨겨진 지식" },
  "8": { concept: "Wealth", conceptZh: "財富", conceptJa: "富", conceptKo: "부", code: "8", description: "Abundance, infinity", descriptionZh: "豐富，無限", descriptionJa: "豊かさ、無限", descriptionKo: "풍요, 무한" },
  "9": { concept: "Completion", conceptZh: "完成", conceptJa: "完成", conceptKo: "완성", code: "9", description: "Fulfillment, end", descriptionZh: "實現，終結", descriptionJa: "成就、終結", descriptionKo: "성취, 종결" },
};

// Special symbol mappings
const SYMBOL_MAP: Record<string, { 
  concept: string; 
  conceptZh: string; 
  conceptJa: string; 
  conceptKo: string; 
  code: string; 
  description: string; 
  descriptionZh: string; 
  descriptionJa: string; 
  descriptionKo: string; 
}> = {
  "#": { concept: "Education", conceptZh: "教育", conceptJa: "教育", conceptKo: "교육", code: "#", description: "Learning and transmission", descriptionZh: "學習與傳承", descriptionJa: "学習と伝承", descriptionKo: "학습과 전승" },
  "@": { concept: "Connection", conceptZh: "連結", conceptJa: "接続", conceptKo: "연결", code: "@", description: "Digital linking", descriptionZh: "數位連結", descriptionJa: "デジタル接続", descriptionKo: "디지털 연결" },
  "&": { concept: "Union", conceptZh: "聯合", conceptJa: "連合", conceptKo: "연합", code: "&", description: "Binding force", descriptionZh: "結合力量", descriptionJa: "結合力", descriptionKo: "결합력" },
  "$": { concept: "Currency", conceptZh: "貨幣", conceptJa: "通貨", conceptKo: "통화", code: "$", description: "Economic flow", descriptionZh: "經濟流動", descriptionJa: "経済の流れ", descriptionKo: "경제 흐름" },
  "%": { concept: "Ratio", conceptZh: "比例", conceptJa: "比率", conceptKo: "비율", code: "%", description: "Proportion and measure", descriptionZh: "比例與度量", descriptionJa: "割合と測定", descriptionKo: "비율과 측정" },
  "!": { concept: "Force", conceptZh: "力量", conceptJa: "力", conceptKo: "힘", code: "!", description: "Exclamation, power", descriptionZh: "驚嘆，力量", descriptionJa: "感嘆、力", descriptionKo: "감탄, 힘" },
  "?": { concept: "Inquiry", conceptZh: "探問", conceptJa: "質問", conceptKo: "질문", code: "?", description: "Question, seeking", descriptionZh: "疑問，尋求", descriptionJa: "疑問、探求", descriptionKo: "의문, 탐구" },
  "*": { concept: "Star", conceptZh: "星辰", conceptJa: "星", conceptKo: "별", code: "*", description: "Radiance, importance", descriptionZh: "光輝，重要性", descriptionJa: "輝き、重要性", descriptionKo: "빛남, 중요성" },
  "+": { concept: "Addition", conceptZh: "增加", conceptJa: "追加", conceptKo: "추가", code: "+", description: "Growth, accumulation", descriptionZh: "成長，累積", descriptionJa: "成長、蓄積", descriptionKo: "성장, 축적" },
  "-": { concept: "Reduction", conceptZh: "減少", conceptJa: "削減", conceptKo: "감소", code: "-", description: "Subtraction, minimalism", descriptionZh: "減法，極簡", descriptionJa: "減算、ミニマリズム", descriptionKo: "감산, 미니멀리즘" },
  "_": { concept: "Ground", conceptZh: "根基", conceptJa: "基盤", conceptKo: "기반", code: "_", description: "Foundation, base", descriptionZh: "基礎，根基", descriptionJa: "基盤、土台", descriptionKo: "기초, 토대" },
  ".": { concept: "Point", conceptZh: "焦點", conceptJa: "焦点", conceptKo: "초점", code: ".", description: "Precision, focus", descriptionZh: "精確，聚焦", descriptionJa: "精度、焦点", descriptionKo: "정밀, 초점" },
};

export function decodeWord(input: string): DecodedLetter[] {
  const result: DecodedLetter[] = [];
  const chars = input.toUpperCase().split("");

  for (const char of chars) {
    // Skip spaces
    if (char === " ") continue;

    const letterData = LETTER_MAP[char];
    const symbolData = SYMBOL_MAP[char];

    if (letterData) {
      result.push({
        letter: char,
        concept: letterData.concept,
        conceptZh: letterData.conceptZh,
        conceptJa: letterData.conceptJa,
        conceptKo: letterData.conceptKo,
        code: letterData.code,
        description: letterData.description,
        descriptionZh: letterData.descriptionZh,
        descriptionJa: letterData.descriptionJa,
        descriptionKo: letterData.descriptionKo,
      });
    } else if (symbolData) {
      result.push({
        letter: char,
        concept: symbolData.concept,
        conceptZh: symbolData.conceptZh,
        conceptJa: symbolData.conceptJa,
        conceptKo: symbolData.conceptKo,
        code: symbolData.code,
        description: symbolData.description,
        descriptionZh: symbolData.descriptionZh,
        descriptionJa: symbolData.descriptionJa,
        descriptionKo: symbolData.descriptionKo,
      });
    } else {
      // Unknown character - mark as void
      result.push({
        letter: char,
        concept: "Unknown",
        conceptZh: "未知",
        conceptJa: "不明",
        conceptKo: "미지",
        code: "?",
        description: "Uncharted territory",
        descriptionZh: "未知領域",
        descriptionJa: "未知の領域",
        descriptionKo: "미지의 영역",
      });
    }
  }

  return result;
}

export function getConceptByLanguage(letter: DecodedLetter, language: Language): string {
  switch (language) {
    case "zh": return letter.conceptZh;
    case "ja": return letter.conceptJa;
    case "ko": return letter.conceptKo;
    default: return letter.concept;
  }
}

export function getDescriptionByLanguage(letter: DecodedLetter, language: Language): string {
  switch (language) {
    case "zh": return letter.descriptionZh;
    case "ja": return letter.descriptionJa;
    case "ko": return letter.descriptionKo;
    default: return letter.description;
  }
}

export function getTotemString(decoded: DecodedLetter[], language: Language = "en"): string {
  return decoded.map((d) => `${d.code}(${getConceptByLanguage(d, language)})`).join("-");
}

// Generate a narrative interpretation
export function generateInterpretation(decoded: DecodedLetter[], language: Language = "en"): string {
  if (decoded.length === 0) return "";

  const first = decoded[0];
  const last = decoded[decoded.length - 1];

  // Build a structural interpretation
  const hasOrder = decoded.some((d) => d.concept === "Order");
  const hasTech = decoded.some((d) => d.concept === "Technology");
  const hasAsset = decoded.some((d) => d.concept === "Asset");
  const hasEnergy = decoded.some((d) => d.concept === "Energy");

  if (language === "zh") {
    const firstConcept = first.conceptZh;
    const lastConcept = last.conceptZh;
    
    let interpretation = `從${firstConcept}流向`;

    if (decoded.length > 2) {
      const middle = decoded.slice(1, -1).map((d) => d.conceptZh);
      interpretation += middle.join("、然後");
      interpretation += "，最終到達";
    }

    interpretation += `${lastConcept}。`;

    // Add structural commentary
    if (hasOrder && hasTech) {
      interpretation += "一個建立在系統精確性上的結構。";
    } else if (hasAsset && hasEnergy) {
      interpretation += "價值被力量所激活。";
    } else if (decoded.length >= 4) {
      interpretation += "一個複雜的相互關聯力量模式。";
    }

    return interpretation;
  }

  if (language === "ja") {
    const firstConcept = first.conceptJa;
    const lastConcept = last.conceptJa;
    
    let interpretation = `${firstConcept}から`;

    if (decoded.length > 2) {
      const middle = decoded.slice(1, -1).map((d) => d.conceptJa);
      interpretation += middle.join("、そして");
      interpretation += "を経て";
    }

    interpretation += `${lastConcept}へ流れる。`;

    if (hasOrder && hasTech) {
      interpretation += "システムの精密さに基づいた構造。";
    } else if (hasAsset && hasEnergy) {
      interpretation += "価値が力によって活性化される。";
    } else if (decoded.length >= 4) {
      interpretation += "相互に関連した力の複雑なパターン。";
    }

    return interpretation;
  }

  if (language === "ko") {
    const firstConcept = first.conceptKo;
    const lastConcept = last.conceptKo;
    
    let interpretation = `${firstConcept}에서`;

    if (decoded.length > 2) {
      const middle = decoded.slice(1, -1).map((d) => d.conceptKo);
      interpretation += middle.join(", 그리고 ");
      interpretation += "을 거쳐";
    }

    interpretation += ` ${lastConcept}(으)로 흐른다.`;

    if (hasOrder && hasTech) {
      interpretation += " 시스템 정밀성에 기반한 구조.";
    } else if (hasAsset && hasEnergy) {
      interpretation += " 가치가 힘에 의해 활성화된다.";
    } else if (decoded.length >= 4) {
      interpretation += " 상호 연관된 힘의 복잡한 패턴.";
    }

    return interpretation;
  }

  // English interpretation
  const concepts = decoded.map((d) => d.concept.toLowerCase());
  let interpretation = `From ${first.concept.toLowerCase()} flows `;

  if (decoded.length > 2) {
    const middle = decoded.slice(1, -1).map((d) => d.concept.toLowerCase());
    interpretation += middle.join(", then ");
    interpretation += ", arriving at ";
  }

  interpretation += `${last.concept.toLowerCase()}.`;

  // Add structural commentary
  if (hasOrder && hasTech) {
    interpretation += " A structure built on systematic precision.";
  } else if (hasAsset && hasEnergy) {
    interpretation += " Value animated by force.";
  } else if (decoded.length >= 4) {
    interpretation += " A complex pattern of interrelated forces.";
  }

  return interpretation;
}
