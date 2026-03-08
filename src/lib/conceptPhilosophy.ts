// Extended philosophical meanings for each concept
// These provide deeper context and structural insights

import type { Language } from "./buoyancisDecoder";

export interface PhilosophicalExtension {
  principle: {
    en: string;
    zh: string;
    ja: string;
    ko: string;
  };
  structuralRole: {
    en: string;
    zh: string;
    ja: string;
    ko: string;
  };
  dynamics: {
    en: string;
    zh: string;
    ja: string;
    ko: string;
  };
  relatedConcepts: string[];
}

// Extended philosophical content for each letter
export const PHILOSOPHICAL_EXTENSIONS: Record<string, PhilosophicalExtension> = {
  A: {
    principle: {
      en: "Assets represent accumulated trust crystallized into tangible or intangible forms. They are the residue of past productive activity.",
      zh: "資產代表累積的信任結晶為有形或無形的形式。它們是過去生產活動的殘留。",
      ja: "資産は蓄積された信頼が有形または無形の形に結晶化したものです。過去の生産活動の残留物です。",
      ko: "자산은 축적된 신뢰가 유형 또는 무형의 형태로 결정화된 것입니다. 과거 생산 활동의 잔류물입니다.",
    },
    structuralRole: {
      en: "In structural terms, assets act as anchors—providing stability and enabling future action through stored capacity.",
      zh: "在結構上，資產作為錨點——通過儲存的能力提供穩定性並促進未來的行動。",
      ja: "構造的には、資産はアンカーとして機能し、蓄積された能力を通じて安定性を提供し、将来の行動を可能にします。",
      ko: "구조적으로 자산은 닻 역할을 하며, 저장된 역량을 통해 안정성을 제공하고 미래 행동을 가능하게 합니다.",
    },
    dynamics: {
      en: "Assets decay without maintenance; they require continuous investment to retain their structural value.",
      zh: "資產若無維護就會衰退；它們需要持續投資才能保持其結構價值。",
      ja: "資産はメンテナンスなしでは衰退します。構造的価値を維持するには継続的な投資が必要です。",
      ko: "자산은 유지 관리 없이는 쇠퇴합니다. 구조적 가치를 유지하려면 지속적인 투자가 필요합니다.",
    },
    relatedConcepts: ["Value", "Resource", "Wealth"],
  },
  B: {
    principle: {
      en: "Birth marks the emergence of new structure from formlessness. Every system begins with a genesis moment that defines its initial conditions.",
      zh: "誕生標誌著新結構從無形中湧現。每個系統都始於一個定義其初始條件的創世時刻。",
      ja: "誕生は無形からの新しい構造の出現を示します。すべてのシステムは、初期条件を定義する創世の瞬間から始まります。",
      ko: "탄생은 무형에서 새로운 구조의 출현을 표시합니다. 모든 시스템은 초기 조건을 정의하는 창세의 순간에서 시작됩니다.",
    },
    structuralRole: {
      en: "Birth establishes the foundational DNA of a structure—patterns that will echo through its entire lifecycle.",
      zh: "誕生確立了結構的基礎 DNA——這些模式將在其整個生命週期中回響。",
      ja: "誕生は構造の基礎DNAを確立します—そのライフサイクル全体を通じて響くパターンです。",
      ko: "탄생은 구조의 기초 DNA를 확립합니다—전체 생명 주기에 걸쳐 울려 퍼질 패턴입니다.",
    },
    dynamics: {
      en: "The conditions of birth constrain future evolution; systems carry their origins forward as embedded tendencies.",
      zh: "誕生的條件制約著未來的演化；系統將其起源作為嵌入的傾向向前攜帶。",
      ja: "誕生の条件は将来の進化を制約します。システムは埋め込まれた傾向として起源を前に運びます。",
      ko: "탄생의 조건은 미래 진화를 제약합니다. 시스템은 내재된 경향으로 기원을 앞으로 운반합니다.",
    },
    relatedConcepts: ["Creation", "Origin", "Genesis"],
  },
  C: {
    principle: {
      en: "Care is the active maintenance of relational bonds. It represents sustained attention to the health of connections within a system.",
      zh: "關懷是對關係紐帶的積極維護。它代表對系統內連接健康的持續關注。",
      ja: "配慮は関係の絆の積極的な維持です。システム内のつながりの健全性への持続的な注意を表します。",
      ko: "배려는 관계 유대의 적극적인 유지입니다. 시스템 내 연결 건강에 대한 지속적인 관심을 나타냅니다.",
    },
    structuralRole: {
      en: "Care functions as the binding agent between structural elements, preventing fragmentation through continuous nurturing.",
      zh: "關懷作為結構元素之間的黏合劑，通過持續培育防止碎片化。",
      ja: "配慮は構造要素間の結合剤として機能し、継続的な育成を通じて断片化を防ぎます。",
      ko: "배려는 구조 요소 간의 결합제로 기능하며, 지속적인 양육을 통해 파편화를 방지합니다.",
    },
    dynamics: {
      en: "Without care, even robust structures drift toward entropy. Care is the counter-force to natural decay.",
      zh: "沒有關懷，即使堅固的結構也會走向熵。關懷是對自然衰退的反作用力。",
      ja: "配慮なしでは、堅牢な構造でさえエントロピーに向かいます。配慮は自然な衰退への反力です。",
      ko: "배려 없이는 견고한 구조도 엔트로피로 향합니다. 배려는 자연적 쇠퇴에 대한 반작용력입니다.",
    },
    relatedConcepts: ["Harmony", "Unity", "Network"],
  },
  D: {
    principle: {
      en: "Duty represents the obligations that arise from structural position. It is the weight carried by nodes within a network of dependencies.",
      zh: "責任代表因結構位置而產生的義務。它是依賴網絡中節點所承載的重量。",
      ja: "義務は構造的位置から生じる責任を表します。依存関係のネットワーク内でノードが担う重みです。",
      ko: "의무는 구조적 위치에서 발생하는 책임을 나타냅니다. 의존성 네트워크 내에서 노드가 지는 무게입니다.",
    },
    structuralRole: {
      en: "Duty creates predictable behavior patterns that others can rely upon, forming the basis of structural trust.",
      zh: "責任創造他人可以依賴的可預測行為模式，形成結構信任的基礎。",
      ja: "義務は他者が頼ることができる予測可能な行動パターンを作り、構造的信頼の基盤を形成します。",
      ko: "의무는 타인이 의지할 수 있는 예측 가능한 행동 패턴을 만들어 구조적 신뢰의 기반을 형성합니다.",
    },
    dynamics: {
      en: "Unfulfilled duty creates structural debt—obligations that compound over time and weaken systemic integrity.",
      zh: "未履行的責任創造結構性債務——隨時間複合並削弱系統完整性的義務。",
      ja: "履行されない義務は構造的負債を生み出します—時間とともに複合し、システムの整合性を弱める義務です。",
      ko: "이행되지 않은 의무는 구조적 부채를 만듭니다—시간이 지남에 따라 복합되어 시스템 무결성을 약화시키는 의무입니다.",
    },
    relatedConcepts: ["Justice", "Order", "Service"],
  },
  E: {
    principle: {
      en: "Energy is the animating force that moves structure through time. Without energy, form becomes static and eventually dissolves.",
      zh: "能量是推動結構穿越時間的活力。沒有能量，形式變得靜態並最終消解。",
      ja: "エネルギーは構造を時間を通じて動かす活力です。エネルギーなしでは、形は静的になり最終的に溶解します。",
      ko: "에너지는 시간을 통해 구조를 움직이는 활력입니다. 에너지 없이는 형태가 정적이 되어 결국 해체됩니다.",
    },
    structuralRole: {
      en: "Energy determines the rate of structural change—high energy systems evolve rapidly; low energy systems calcify.",
      zh: "能量決定結構變化的速率——高能量系統快速演化；低能量系統�ite化。",
      ja: "エネルギーは構造変化の速度を決定します—高エネルギーシステムは急速に進化し、低エネルギーシステムは�ite化します。",
      ko: "에너지는 구조 변화의 속도를 결정합니다—고에너지 시스템은 빠르게 진화하고, 저에너지 시스템은 석회화됩니다.",
    },
    dynamics: {
      en: "Energy flows toward areas of lower potential, creating gradients that drive structural transformation.",
      zh: "能量流向低電位區域，創造驅動結構轉化的梯度。",
      ja: "エネルギーは低い電位の領域に流れ、構造変換を駆動する勾配を作ります。",
      ko: "에너지는 낮은 전위 영역으로 흘러 구조 변환을 주도하는 기울기를 만듭니다.",
    },
    relatedConcepts: ["Flow", "Change", "Power"],
  },
  F: {
    principle: {
      en: "Flow represents the continuous movement of resources, information, and energy through structural channels.",
      zh: "流動代表資源、信息和能量通過結構通道的持續運動。",
      ja: "流れは、構造的チャネルを通じてのリソース、情報、エネルギーの継続的な動きを表します。",
      ko: "흐름은 구조적 채널을 통한 자원, 정보, 에너지의 지속적인 움직임을 나타냅니다.",
    },
    structuralRole: {
      en: "Flow maintains system vitality by preventing stagnation. Blocked flow creates pressure points that threaten structural integrity.",
      zh: "流動通過防止停滯來維持系統活力。阻塞的流動創造威脅結構完整性的壓力點。",
      ja: "流れは停滞を防ぐことでシステムの活力を維持します。阻害された流れは構造的整合性を脅かす圧力ポイントを作ります。",
      ko: "흐름은 정체를 방지하여 시스템 활력을 유지합니다. 차단된 흐름은 구조적 무결성을 위협하는 압력 지점을 만듭니다.",
    },
    dynamics: {
      en: "Healthy systems optimize for flow rather than accumulation—what moves creates more value than what stagnates.",
      zh: "健康的系統優化流動而非累積——流動的創造比停滯的更有價值。",
      ja: "健全なシステムは蓄積よりも流れを最適化します—動くものは停滞するものより多くの価値を生み出します。",
      ko: "건강한 시스템은 축적보다 흐름을 최적화합니다—움직이는 것이 정체된 것보다 더 많은 가치를 창출합니다.",
    },
    relatedConcepts: ["Energy", "Network", "Exchange"],
  },
  G: {
    principle: {
      en: "Growth is the expansion of structural capacity over time. It represents the accumulation of complexity and capability.",
      zh: "成長是結構能力隨時間的擴展。它代表複雜性和能力的累積。",
      ja: "成長は時間の経過に伴う構造的能力の拡大です。複雑さと能力の蓄積を表します。",
      ko: "성장은 시간에 따른 구조적 역량의 확장입니다. 복잡성과 능력의 축적을 나타냅니다.",
    },
    structuralRole: {
      en: "Growth creates new nodes and connections, expanding the network's reach and resilience.",
      zh: "成長創造新的節點和連接，擴展網絡的範圍和韌性。",
      ja: "成長は新しいノードと接続を作り、ネットワークの範囲と回復力を拡大します。",
      ko: "성장은 새로운 노드와 연결을 만들어 네트워크의 범위와 회복력을 확장합니다.",
    },
    dynamics: {
      en: "Unchecked growth leads to fragility; sustainable growth balances expansion with consolidation.",
      zh: "不受控制的成長導致脆弱；可持續的成長平衡擴張與整合。",
      ja: "制御されない成長は脆弱性につながります。持続可能な成長は拡大と統合のバランスを取ります。",
      ko: "통제되지 않은 성장은 취약성으로 이어집니다. 지속 가능한 성장은 확장과 통합의 균형을 맞춥니다.",
    },
    relatedConcepts: ["Asset", "Integration", "Yield"],
  },
  H: {
    principle: {
      en: "Harmony is the state of balanced tension between competing forces. It is not the absence of conflict but its productive resolution.",
      zh: "和諧是競爭力量之間平衡張力的狀態。它不是衝突的缺失，而是其生產性解決。",
      ja: "調和は競合する力の間のバランスの取れた緊張状態です。紛争の不在ではなく、その生産的な解決です。",
      ko: "조화는 경쟁하는 힘들 사이의 균형 잡힌 긴장 상태입니다. 갈등의 부재가 아니라 생산적인 해결입니다.",
    },
    structuralRole: {
      en: "Harmony enables sustained operation by preventing any single element from dominating or collapsing the whole.",
      zh: "和諧通過防止任何單一元素主導或崩潰整體來實現持續運作。",
      ja: "調和は、単一の要素が全体を支配または崩壊させることを防ぐことで、持続的な運用を可能にします。",
      ko: "조화는 단일 요소가 전체를 지배하거나 붕괴시키는 것을 방지하여 지속적인 운영을 가능하게 합니다.",
    },
    dynamics: {
      en: "Harmony is dynamic, not static—it requires continuous adjustment as conditions change.",
      zh: "和諧是動態的，而非靜態的——隨著條件變化需要持續調整。",
      ja: "調和は動的であり、静的ではありません—条件が変化するにつれて継続的な調整が必要です。",
      ko: "조화는 정적이 아니라 동적입니다—조건이 변함에 따라 지속적인 조정이 필요합니다.",
    },
    relatedConcepts: ["Balance", "Unity", "Order"],
  },
  I: {
    principle: {
      en: "Integration is the process of synthesizing disparate elements into coherent wholes. It transforms fragments into functioning systems.",
      zh: "整合是將不同元素綜合成連貫整體的過程。它將碎片轉化為運作的系統。",
      ja: "統合は異なる要素を一貫した全体に統合するプロセスです。断片を機能するシステムに変換します。",
      ko: "통합은 이질적인 요소들을 일관된 전체로 종합하는 과정입니다. 파편을 기능하는 시스템으로 변환합니다.",
    },
    structuralRole: {
      en: "Integration increases structural efficiency by eliminating redundancy and creating shared pathways.",
      zh: "整合通過消除冗餘和創建共享路徑來提高結構效率。",
      ja: "統合は冗長性を排除し、共有経路を作成することで構造効率を向上させます。",
      ko: "통합은 중복을 제거하고 공유 경로를 만들어 구조적 효율성을 높입니다.",
    },
    dynamics: {
      en: "Over-integration creates brittleness; healthy systems maintain some modularity for resilience.",
      zh: "過度整合造成脆弱；健康的系統為韌性保持一定的模塊化。",
      ja: "過度な統合は脆弱性を生み出します。健全なシステムは回復力のためにいくらかのモジュール性を維持します。",
      ko: "과도한 통합은 취약성을 만듭니다. 건강한 시스템은 회복력을 위해 어느 정도의 모듈성을 유지합니다.",
    },
    relatedConcepts: ["Unity", "Harmony", "Network"],
  },
  J: {
    principle: {
      en: "Justice is the principle of proportional response—ensuring that inputs and outputs remain in reasonable balance across the system.",
      zh: "正義是比例回應的原則——確保整個系統中輸入和輸出保持合理平衡。",
      ja: "正義は比例的対応の原則です—システム全体で入力と出力が合理的なバランスを保つことを保証します。",
      ko: "정의는 비례 대응의 원칙입니다—시스템 전반에 걸쳐 입력과 출력이 합리적인 균형을 유지하도록 보장합니다.",
    },
    structuralRole: {
      en: "Justice maintains system legitimacy by ensuring fair distribution of burdens and benefits.",
      zh: "正義通過確保負擔和利益的公平分配來維持系統的正當性。",
      ja: "正義は負担と利益の公平な分配を確保することでシステムの正当性を維持します。",
      ko: "정의는 부담과 혜택의 공정한 분배를 보장하여 시스템의 정당성을 유지합니다.",
    },
    dynamics: {
      en: "Perceived injustice erodes trust faster than any other structural failure.",
      zh: "感知到的不公正比任何其他結構性失敗都更快地侵蝕信任。",
      ja: "認識された不正義は、他のどの構造的失敗よりも速く信頼を侵食します。",
      ko: "인지된 불의는 다른 어떤 구조적 실패보다 빠르게 신뢰를 침식합니다.",
    },
    relatedConcepts: ["Duty", "Order", "Balance"],
  },
  K: {
    principle: {
      en: "Knowledge is structured information that enables prediction and effective action. It is the compressed essence of experience.",
      zh: "知識是使預測和有效行動成為可能的結構化信息。它是經驗的壓縮精華。",
      ja: "知識は予測と効果的な行動を可能にする構造化された情報です。経験の圧縮された本質です。",
      ko: "지식은 예측과 효과적인 행동을 가능하게 하는 구조화된 정보입니다. 경험의 압축된 본질입니다.",
    },
    structuralRole: {
      en: "Knowledge reduces uncertainty, enabling more precise structural decisions and resource allocation.",
      zh: "知識減少不確定性，使更精確的結構決策和資源分配成為可能。",
      ja: "知識は不確実性を減らし、より正確な構造的決定とリソース配分を可能にします。",
      ko: "지식은 불확실성을 줄여 더 정밀한 구조적 결정과 자원 배분을 가능하게 합니다.",
    },
    dynamics: {
      en: "Knowledge decays as contexts change; what worked yesterday may mislead tomorrow.",
      zh: "知識隨著環境變化而衰退；昨天有效的可能會在明天誤導。",
      ja: "知識はコンテキストが変化するにつれて衰退します。昨日うまくいったことが明日は誤解を招くかもしれません。",
      ko: "지식은 맥락이 변함에 따라 쇠퇴합니다. 어제 효과가 있었던 것이 내일은 오해를 불러일으킬 수 있습니다.",
    },
    relatedConcepts: ["Wisdom", "Quest", "Understanding"],
  },
  L: {
    principle: {
      en: "Leisure is the space between productive cycles where systems regenerate and recalibrate. It is not waste but investment in future capacity.",
      zh: "休閒是生產週期之間系統再生和重新校準的空間。它不是浪費，而是對未來能力的投資。",
      ja: "余暇はシステムが再生し再調整する生産サイクル間のスペースです。無駄ではなく、将来の能力への投資です。",
      ko: "여가는 시스템이 재생하고 재조정하는 생산 주기 사이의 공간입니다. 낭비가 아니라 미래 역량에 대한 투자입니다.",
    },
    structuralRole: {
      en: "Leisure prevents burnout by allowing accumulated stress to dissipate and fresh perspectives to emerge.",
      zh: "休閒通過允許累積的壓力消散和新視角出現來防止倦怠。",
      ja: "余暇は蓄積されたストレスを発散させ、新鮮な視点が生まれることを可能にすることで燃え尽きを防ぎます。",
      ko: "여가는 축적된 스트레스가 해소되고 새로운 관점이 나타나도록 하여 번아웃을 방지합니다.",
    },
    dynamics: {
      en: "Systems that eliminate leisure sacrifice long-term resilience for short-term output.",
      zh: "消除休閒的系統為短期產出犧牲長期韌性。",
      ja: "余暇を排除するシステムは、短期的な出力のために長期的な回復力を犠牲にします。",
      ko: "여가를 제거하는 시스템은 단기 출력을 위해 장기적인 회복력을 희생합니다.",
    },
    relatedConcepts: ["Rest", "Harmony", "Balance"],
  },
  M: {
    principle: {
      en: "Matter is the substrate upon which all structure is built. It represents the physical constraints that bound possibility.",
      zh: "物質是所有結構構建的基底。它代表限制可能性的物理約束。",
      ja: "物質はすべての構造が構築される基盤です。可能性を制限する物理的制約を表します。",
      ko: "물질은 모든 구조가 구축되는 기반입니다. 가능성을 제한하는 물리적 제약을 나타냅니다.",
    },
    structuralRole: {
      en: "Matter provides the raw material for structural formation; its properties determine what configurations are possible.",
      zh: "物質提供結構形成的原材料；其屬性決定什麼配置是可能的。",
      ja: "物質は構造形成のための原材料を提供します。その特性がどのような構成が可能かを決定します。",
      ko: "물질은 구조 형성을 위한 원료를 제공합니다. 그 특성이 어떤 구성이 가능한지를 결정합니다.",
    },
    dynamics: {
      en: "Matter transforms but never disappears; structural changes redistribute rather than create or destroy.",
      zh: "物質轉化但永不消失；結構變化重新分配而非創造或破壞。",
      ja: "物質は変化しますが決して消えません。構造的変化は創造や破壊ではなく再分配します。",
      ko: "물질은 변환되지만 결코 사라지지 않습니다. 구조적 변화는 창조나 파괴가 아니라 재분배합니다.",
    },
    relatedConcepts: ["Resource", "Foundation", "Substance"],
  },
  N: {
    principle: {
      en: "Network represents the web of connections that enable coordination and information flow between structural elements.",
      zh: "網絡代表使結構元素之間的協調和信息流動成為可能的連接網。",
      ja: "ネットワークは構造要素間の調整と情報の流れを可能にする接続のウェブを表します。",
      ko: "네트워크는 구조 요소 간의 조정과 정보 흐름을 가능하게 하는 연결 웹을 나타냅니다.",
    },
    structuralRole: {
      en: "Networks distribute load and information, creating redundancy that enhances system resilience.",
      zh: "網絡分配負載和信息，創造增強系統韌性的冗餘。",
      ja: "ネットワークは負荷と情報を分散し、システムの回復力を高める冗長性を作ります。",
      ko: "네트워크는 부하와 정보를 분산시켜 시스템 회복력을 향상시키는 중복성을 만듭니다.",
    },
    dynamics: {
      en: "Network effects can be positive (growth begets growth) or negative (congestion and complexity).",
      zh: "網絡效應可以是正面的（成長帶來成長）或負面的（擁堵和複雜性）。",
      ja: "ネットワーク効果はプラス（成長が成長を生む）またはマイナス（混雑と複雑さ）になり得ます。",
      ko: "네트워크 효과는 긍정적(성장이 성장을 낳음)이거나 부정적(혼잡과 복잡성)일 수 있습니다.",
    },
    relatedConcepts: ["Connection", "Flow", "Integration"],
  },
  O: {
    principle: {
      en: "Order is the arrangement of elements according to consistent principles. It makes complexity navigable and predictable.",
      zh: "秩序是根據一致原則排列元素。它使複雜性可導航和可預測。",
      ja: "秩序は一貫した原則に従った要素の配置です。複雑さをナビゲート可能で予測可能にします。",
      ko: "질서는 일관된 원칙에 따른 요소의 배열입니다. 복잡성을 탐색 가능하고 예측 가능하게 만듭니다.",
    },
    structuralRole: {
      en: "Order reduces the cognitive and operational load of maintaining complex systems.",
      zh: "秩序減少維護複雜系統的認知和操作負擔。",
      ja: "秩序は複雑なシステムを維持するための認知的および運用上の負荷を軽減します。",
      ko: "질서는 복잡한 시스템을 유지하는 인지적 및 운영적 부담을 줄입니다.",
    },
    dynamics: {
      en: "Excessive order becomes rigidity; optimal order preserves flexibility within clear boundaries.",
      zh: "過度的秩序變成僵化；最佳秩序在明確邊界內保持靈活性。",
      ja: "過度な秩序は硬直になります。最適な秩序は明確な境界内で柔軟性を維持します。",
      ko: "과도한 질서는 경직성이 됩니다. 최적의 질서는 명확한 경계 내에서 유연성을 유지합니다.",
    },
    relatedConcepts: ["Structure", "Harmony", "Foundation"],
  },
  P: {
    principle: {
      en: "Power is the capacity to influence structural outcomes. It flows from asymmetries in resources, position, or knowledge.",
      zh: "權力是影響結構結果的能力。它來自資源、位置或知識的不對稱。",
      ja: "権力は構造的結果に影響を与える能力です。リソース、ポジション、または知識の非対称性から生じます。",
      ko: "권력은 구조적 결과에 영향을 미치는 역량입니다. 자원, 위치, 또는 지식의 비대칭에서 흐릅니다.",
    },
    structuralRole: {
      en: "Power concentrates decision-making, enabling rapid coordination but risking single points of failure.",
      zh: "權力集中決策，實現快速協調但冒著單點故障的風險。",
      ja: "権力は意思決定を集中させ、迅速な調整を可能にしますが、単一障害点のリスクがあります。",
      ko: "권력은 의사결정을 집중시켜 신속한 조정을 가능하게 하지만 단일 실패 지점의 위험이 있습니다.",
    },
    dynamics: {
      en: "Power tends toward concentration unless actively distributed; unchecked power destabilizes the systems it controls.",
      zh: "權力傾向於集中，除非主動分配；不受限制的權力會破壞它所控制的系統的穩定。",
      ja: "権力は積極的に分散されない限り集中する傾向があります。制御されない権力は、それが制御するシステムを不安定にします。",
      ko: "권력은 적극적으로 분산되지 않는 한 집중되는 경향이 있습니다. 통제되지 않은 권력은 그것이 통제하는 시스템을 불안정하게 합니다.",
    },
    relatedConcepts: ["Authority", "Energy", "Control"],
  },
  Q: {
    principle: {
      en: "Quest is the active search for what is not yet known or possessed. It drives structural evolution and adaptation.",
      zh: "探索是對尚未知道或擁有的事物的積極搜尋。它驅動結構演化和適應。",
      ja: "探求はまだ知られていないまたは所有していないものへの積極的な探索です。構造的進化と適応を推進します。",
      ko: "탐구는 아직 알려지지 않았거나 소유하지 않은 것에 대한 적극적인 탐색입니다. 구조적 진화와 적응을 추진합니다.",
    },
    structuralRole: {
      en: "Quest creates the exploratory probes that discover new structural possibilities before they become necessary.",
      zh: "探索創造探索性探針，在結構可能性變得必要之前發現它們。",
      ja: "探求は、構造的可能性が必要になる前にそれを発見する探索的プローブを作成します。",
      ko: "탐구는 구조적 가능성이 필요해지기 전에 발견하는 탐색적 프로브를 만듭니다.",
    },
    dynamics: {
      en: "Questing requires tolerance for failure; premature optimization kills the exploratory capacity.",
      zh: "探索需要對失敗的容忍；過早優化會扼殺探索能力。",
      ja: "探求は失敗への寛容を必要とします。早すぎる最適化は探索能力を殺します。",
      ko: "탐구는 실패에 대한 관용을 필요로 합니다. 조기 최적화는 탐색 능력을 죽입니다.",
    },
    relatedConcepts: ["Knowledge", "Growth", "Discovery"],
  },
  R: {
    principle: {
      en: "Resource represents the inputs required for structural maintenance and growth. Scarcity of resources constrains structural possibility.",
      zh: "資源代表結構維護和成長所需的投入。資源稀缺限制結構可能性。",
      ja: "資源は構造の維持と成長に必要な入力を表します。資源の希少性は構造的可能性を制約します。",
      ko: "자원은 구조 유지 및 성장에 필요한 입력을 나타냅니다. 자원 부족은 구조적 가능성을 제약합니다.",
    },
    structuralRole: {
      en: "Resources fuel all structural processes; their allocation determines what gets built and what withers.",
      zh: "資源為所有結構過程提供動力；它們的分配決定什麼被建造，什麼枯萎。",
      ja: "資源はすべての構造的プロセスに燃料を供給します。その配分は何が構築され、何が衰退するかを決定します。",
      ko: "자원은 모든 구조적 프로세스에 연료를 공급합니다. 그 배분이 무엇이 구축되고 무엇이 쇠퇴하는지를 결정합니다.",
    },
    dynamics: {
      en: "Resource competition drives structural selection; efficiency in resource use is a key survival trait.",
      zh: "資源競爭驅動結構選擇；資源使用效率是關鍵的生存特徵。",
      ja: "資源競争は構造的選択を推進します。資源使用の効率性は重要な生存特性です。",
      ko: "자원 경쟁은 구조적 선택을 주도합니다. 자원 사용 효율성은 핵심 생존 특성입니다.",
    },
    relatedConcepts: ["Asset", "Matter", "Supply"],
  },
  S: {
    principle: {
      en: "Service is the contribution of capacity to others without immediate reciprocation. It builds relational credit and systemic trust.",
      zh: "服務是在沒有立即回報的情況下向他人貢獻能力。它建立關係信用和系統信任。",
      ja: "サービスは即時の見返りなしに他者に能力を提供することです。関係的信用とシステム的信頼を構築します。",
      ko: "서비스는 즉각적인 보답 없이 타인에게 역량을 기여하는 것입니다. 관계적 신용과 시스템적 신뢰를 구축합니다.",
    },
    structuralRole: {
      en: "Service creates the social capital that lubricates complex coordination and enables delayed exchange.",
      zh: "服務創造潤滑複雜協調和實現延遲交換的社會資本。",
      ja: "サービスは複雑な調整を潤滑し、遅延交換を可能にする社会資本を作ります。",
      ko: "서비스는 복잡한 조정을 윤활하고 지연된 교환을 가능하게 하는 사회적 자본을 만듭니다.",
    },
    dynamics: {
      en: "Service given creates expectation of reciprocity; unbalanced service flows generate structural resentment.",
      zh: "給予的服務創造回報的期望；不平衡的服務流動產生結構性怨恨。",
      ja: "与えられたサービスは互恵の期待を生み出します。不均衡なサービスの流れは構造的な恨みを生み出します。",
      ko: "주어진 서비스는 호혜의 기대를 만듭니다. 불균형한 서비스 흐름은 구조적 원한을 생성합니다.",
    },
    relatedConcepts: ["Care", "Duty", "Network"],
  },
  T: {
    principle: {
      en: "Technology is the codified knowledge that extends structural capability beyond natural limits.",
      zh: "技術是將結構能力延伸超越自然限制的編碼知識。",
      ja: "技術は構造的能力を自然な限界を超えて拡張する体系化された知識です。",
      ko: "기술은 구조적 역량을 자연적 한계를 넘어 확장하는 체계화된 지식입니다.",
    },
    structuralRole: {
      en: "Technology amplifies human capacity, enabling structures of complexity impossible through unaided effort.",
      zh: "技術放大人類能力，使得通過無輔助努力不可能的複雜結構成為可能。",
      ja: "技術は人間の能力を増幅し、支援なしの努力では不可能な複雑さの構造を可能にします。",
      ko: "기술은 인간 역량을 증폭시켜 도움 없는 노력으로는 불가능한 복잡한 구조를 가능하게 합니다.",
    },
    dynamics: {
      en: "Technology evolves faster than the social structures that govern it, creating persistent governance gaps.",
      zh: "技術演化比治理它的社會結構更快，創造持續的治理差距。",
      ja: "技術はそれを統治する社会構造よりも速く進化し、持続的なガバナンスギャップを生み出します。",
      ko: "기술은 그것을 관리하는 사회 구조보다 빠르게 진화하여 지속적인 거버넌스 격차를 만듭니다.",
    },
    relatedConcepts: ["Knowledge", "Power", "System"],
  },
  U: {
    principle: {
      en: "Unity is the cohesive force that binds elements into a functioning whole. It transforms parts into participants.",
      zh: "團結是將元素結合成運作整體的凝聚力。它將部分轉化為參與者。",
      ja: "団結は要素を機能する全体に結びつける凝集力です。部分を参加者に変換します。",
      ko: "단결은 요소들을 기능하는 전체로 결합시키는 응집력입니다. 부분을 참여자로 변환합니다.",
    },
    structuralRole: {
      en: "Unity creates shared identity and purpose, enabling coordinated action toward common objectives.",
      zh: "團結創造共同身份和目標，實現朝向共同目標的協調行動。",
      ja: "団結は共有されたアイデンティティと目的を作り、共通の目標に向けた協調行動を可能にします。",
      ko: "단결은 공유된 정체성과 목적을 만들어 공통 목표를 향한 조정된 행동을 가능하게 합니다.",
    },
    dynamics: {
      en: "Unity requires ongoing cultivation; differences suppressed rather than integrated eventually fragment the whole.",
      zh: "團結需要持續培養；被壓制而非整合的差異最終會分裂整體。",
      ja: "団結は継続的な育成を必要とします。統合されずに抑制された違いは最終的に全体を断片化します。",
      ko: "단결은 지속적인 배양이 필요합니다. 통합되지 않고 억압된 차이는 결국 전체를 파편화합니다.",
    },
    relatedConcepts: ["Harmony", "Integration", "Care"],
  },
  V: {
    principle: {
      en: "Value is the measure of structural significance—what matters and to what degree. It guides resource allocation.",
      zh: "價值是結構重要性的衡量——什麼重要以及重要程度。它指導資源分配。",
      ja: "価値は構造的重要性の尺度です—何が重要で、どの程度重要か。リソース配分を導きます。",
      ko: "가치는 구조적 중요성의 척도입니다—무엇이 중요하고 어느 정도인지. 자원 배분을 안내합니다.",
    },
    structuralRole: {
      en: "Value hierarchies determine which structures receive investment and which are allowed to decay.",
      zh: "價值層級決定哪些結構獲得投資，哪些被允許衰退。",
      ja: "価値の階層は、どの構造が投資を受け、どの構造が衰退を許されるかを決定します。",
      ko: "가치 계층은 어떤 구조가 투자를 받고 어떤 구조가 쇠퇴하도록 허용되는지를 결정합니다.",
    },
    dynamics: {
      en: "Values evolve as contexts change; yesterday's priority becomes tomorrow's obstacle.",
      zh: "價值隨著環境變化而演化；昨天的優先事項成為明天的障礙。",
      ja: "価値はコンテキストが変化するにつれて進化します。昨日の優先事項が明日の障害になります。",
      ko: "가치는 맥락이 변함에 따라 진화합니다. 어제의 우선순위가 내일의 장애물이 됩니다.",
    },
    relatedConcepts: ["Asset", "Worth", "Significance"],
  },
  W: {
    principle: {
      en: "Wisdom is the capacity to apply knowledge appropriately across varied contexts. It transcends mere information.",
      zh: "智慧是在不同情境中適當應用知識的能力。它超越了單純的信息。",
      ja: "知恵は様々なコンテキストで適切に知識を適用する能力です。単なる情報を超越します。",
      ko: "지혜는 다양한 맥락에서 지식을 적절히 적용하는 역량입니다. 단순한 정보를 초월합니다.",
    },
    structuralRole: {
      en: "Wisdom enables structural adaptation without losing essential identity or purpose.",
      zh: "智慧使結構適應成為可能，而不會失去本質身份或目的。",
      ja: "知恵は本質的なアイデンティティや目的を失うことなく構造的適応を可能にします。",
      ko: "지혜는 본질적인 정체성이나 목적을 잃지 않고 구조적 적응을 가능하게 합니다.",
    },
    dynamics: {
      en: "Wisdom accumulates slowly through experience and reflection; it cannot be transferred, only cultivated.",
      zh: "智慧通過經驗和反思緩慢積累；它不能轉移，只能培養。",
      ja: "知恵は経験と反省を通じてゆっくりと蓄積されます。転送することはできず、培養するのみです。",
      ko: "지혜는 경험과 성찰을 통해 천천히 축적됩니다. 전달될 수 없고 오직 배양될 뿐입니다.",
    },
    relatedConcepts: ["Knowledge", "Understanding", "Experience"],
  },
  X: {
    principle: {
      en: "Exchange is the reciprocal transfer of value between structural elements. It enables specialization and interdependence.",
      zh: "交換是結構元素之間價值的相互轉移。它使專業化和相互依賴成為可能。",
      ja: "交換は構造要素間の価値の相互移転です。専門化と相互依存を可能にします。",
      ko: "교환은 구조 요소 간의 가치의 상호 이전입니다. 전문화와 상호의존을 가능하게 합니다.",
    },
    structuralRole: {
      en: "Exchange creates the flows that connect specialized nodes into integrated systems.",
      zh: "交換創造將專門節點連接成整合系統的流動。",
      ja: "交換は専門化されたノードを統合システムに接続する流れを作ります。",
      ko: "교환은 전문화된 노드를 통합 시스템으로 연결하는 흐름을 만듭니다.",
    },
    dynamics: {
      en: "Fair exchange builds trust; exploitative exchange eventually breaks the connections it depends upon.",
      zh: "公平交換建立信任；剝削性交換最終會破壞它所依賴的連接。",
      ja: "公正な交換は信頼を構築します。搾取的な交換は最終的にそれが依存する接続を壊します。",
      ko: "공정한 교환은 신뢰를 구축합니다. 착취적 교환은 결국 그것이 의존하는 연결을 끊습니다.",
    },
    relatedConcepts: ["Flow", "Network", "Value"],
  },
  Y: {
    principle: {
      en: "Yield is the productive output that emerges from structural processes. It is the harvest of accumulated investment.",
      zh: "產出是從結構過程中產生的生產性輸出。它是累積投資的收穫。",
      ja: "産出は構造的プロセスから生じる生産的な出力です。蓄積された投資の収穫です。",
      ko: "산출은 구조적 과정에서 나오는 생산적 출력입니다. 축적된 투자의 수확입니다.",
    },
    structuralRole: {
      en: "Yield validates structural configurations; consistently low yield signals the need for restructuring.",
      zh: "產出驗證結構配置；持續低產出信號需要重組。",
      ja: "産出は構造的構成を検証します。一貫して低い産出は再構築の必要性を示唆します。",
      ko: "산출은 구조적 구성을 검증합니다. 지속적으로 낮은 산출은 재구조화의 필요성을 신호합니다.",
    },
    dynamics: {
      en: "Yield reinvested creates compounding growth; yield extracted without reinvestment leads to gradual depletion.",
      zh: "再投資的產出創造複合增長；沒有再投資的提取產出導致逐漸枯竭。",
      ja: "再投資された産出は複利成長を生み出します。再投資なしに抽出された産出は徐々に枯渇につながります。",
      ko: "재투자된 산출은 복리 성장을 만듭니다. 재투자 없이 추출된 산출은 점진적인 고갈로 이어집니다.",
    },
    relatedConcepts: ["Growth", "Asset", "Production"],
  },
  Z: {
    principle: {
      en: "Zero represents the void from which structure emerges and to which it returns. It is pure potential before differentiation.",
      zh: "歸零代表結構從中湧現並返回的虛空。它是分化之前的純粹潛能。",
      ja: "ゼロは構造が出現し、戻る虚空を表します。分化前の純粋な可能性です。",
      ko: "영점은 구조가 출현하고 돌아가는 허공을 나타냅니다. 분화 이전의 순수한 잠재력입니다.",
    },
    structuralRole: {
      en: "Zero provides the clean slate necessary for radical restructuring and new beginnings.",
      zh: "歸零提供激進重組和新開始所需的白紙狀態。",
      ja: "ゼロは根本的な再構築と新たな始まりに必要な白紙の状態を提供します。",
      ko: "영점은 급진적 재구조화와 새로운 시작에 필요한 백지 상태를 제공합니다.",
    },
    dynamics: {
      en: "Return to zero is inevitable for all structures; the question is whether it happens through graceful transition or catastrophic collapse.",
      zh: "回歸零對所有結構來說是不可避免的；問題是它是通過優雅的過渡還是災難性的崩潰發生。",
      ja: "ゼロへの回帰はすべての構造にとって不可避です。問題は、それが優雅な移行を通じて起こるか、壊滅的な崩壊を通じて起こるかです。",
      ko: "영점으로의 복귀는 모든 구조에 불가피합니다. 문제는 그것이 우아한 전환을 통해 일어나는지 재앙적 붕괴를 통해 일어나는지입니다.",
    },
    relatedConcepts: ["Void", "Potential", "Beginning"],
  },
};

// Get philosophical extension by letter
export function getPhilosophicalExtension(letter: string): PhilosophicalExtension | undefined {
  return PHILOSOPHICAL_EXTENSIONS[letter.toUpperCase()];
}

// Get localized philosophical content
export function getLocalizedPhilosophy(letter: string, language: Language) {
  const ext = getPhilosophicalExtension(letter);
  if (!ext) return null;
  
  return {
    principle: ext.principle[language],
    structuralRole: ext.structuralRole[language],
    dynamics: ext.dynamics[language],
    relatedConcepts: ext.relatedConcepts,
  };
}
