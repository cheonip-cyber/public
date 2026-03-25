import { Rank, NPC } from './types';

export const RANKS: Rank[] = [
  "9급 서기보", "8급 서기", "7급 주사보", "6급 주사", "5급 사무관", "시장"
];

export const RANK_THRESHOLDS = [0, 50, 120, 200, 300, 450];

// 배경 이미지 URL (Unsplash 무료)
export const BG_URLS: Record<string, string> = {
  counter: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1920',
  parking: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=1920',
  pantry:  'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=1920',
};

/**
 * 캐릭터 목록
 * imageUrl: /public/ 폴더 기준 경로 (Vite가 정적 서빙)
 *
 * 파일 순서 매핑 (사용자 첨부 순서: 1,2,3,4,5,6,7,9,10,8)
 *  1_나절차.png  → id:1 나절차
 *  2_박급해.png  → id:2 박급해
 *  3_김인플.png  → id:3 김인플
 *  4_정다정.png  → id:4 정다정
 *  5_이호의.png  → id:5 이호의
 *  6_최강력.png  → id:6 최강력
 *  7_오해해.png  → id:7 오해해
 *  9_조용히.png  → id:9 조용히  (첨부 8번째)
 *  10_이미안.png → id:10 이미안 (첨부 9번째)
 *  8_한까탈.png  → id:8 한까탈  (첨부 10번째)
 */
export const CHARACTERS: NPC[] = [
  {
    id: 1,
    name: "나절차",
    trait: "깐깐한 원칙주의자, 모든 것을 법대로 처리하길 원함. 법조항을 달달 외우고 있음.",
    issue: "옆집 담장이 규정보다 1cm 높다며 즉시 철거 행정명령 요구",
    bg: "counter",
    avatar: "🧐",
    imageUrl: "/1_나절차.png",
  },
  {
    id: 2,
    name: "박급해",
    trait: "성격이 매우 급한 어르신. 기다리는 것을 극도로 싫어하고 반말을 씀.",
    issue: "번호표 뽑자마자 왜 안 부르냐며 지팡이로 창구를 두드림",
    bg: "counter",
    avatar: "👴",
    imageUrl: "/2_박급해.png",
  },
  {
    id: 3,
    name: "김인플",
    trait: "SNS 생중계형. 모든 상황을 촬영하며 구독자 앞에서 주무관을 압박함.",
    issue: "민원실 조명이 셀카 찍기에 부적합하다며 조명 교체 요구",
    bg: "counter",
    avatar: "🤳",
    imageUrl: "/3_김인플.png",
  },
  {
    id: 4,
    name: "정다정",
    trait: "이야기꾼 할머니. 본론보다 주변 이야기가 훨씬 길고, 과자를 잔뜩 들고 옴.",
    issue: "기초연금 물으러 왔다가 손주 군대 간 이야기부터 시작함",
    bg: "counter",
    avatar: "👵",
    imageUrl: "/4_정다정.png",
  },
  {
    id: 5,
    name: "이호의",
    trait: "청탁 시도형. 은근슬쩍 호의를 베풀며 편의를 요구하는 능수능란한 스타일.",
    issue: "과태료 좀 깎아달라며 책상 밑으로 에너지 음료 박스를 밀어넣음",
    bg: "pantry",
    avatar: "🤫",
    imageUrl: "/5_이호의.png",
  },
  {
    id: 6,
    name: "최강력",
    trait: "협박형. 근육질 체형에 문신, 시장님 친분을 과시하며 고성을 지름.",
    issue: "불법주차 단속에 항의하며 담당자 징계하겠다고 협박",
    bg: "parking",
    avatar: "😡",
    imageUrl: "/6_최강력.png",
  },
  {
    id: 7,
    name: "오해해",
    trait: "정보 왜곡형. 본인 유리한 대로만 듣고 나중에 딴소리함. 혼란스러운 표정이 특징.",
    issue: "안 된다고 한 설명을 '해준다'고 들었다며 확약서 요구",
    bg: "counter",
    avatar: "😵‍💫",
    imageUrl: "/7_오해해.png",
  },
  {
    id: 8,
    name: "한까탈",
    trait: "위생 예민형. 민원실 청결 상태에 사사건건 시비를 걸며 꼼꼼히 기록함.",
    issue: "정수기 컵에 지문이 묻어있다며 구청장 면담 요구",
    bg: "counter",
    avatar: "😷",
    imageUrl: "/8_한까탈.png",
  },
  {
    id: 9,
    name: "조용히",
    trait: "과묵한 민원인. 말을 거의 안 하고 모자를 눌러쓴 채 눈빛으로만 압박함.",
    issue: "서류 한 장 내밀고 아무 말 없이 처리될 때까지 뚫어지게 쳐다봄",
    bg: "pantry",
    avatar: "😶",
    imageUrl: "/9_조용히.png",
  },
  {
    id: 10,
    name: "이미안",
    trait: "소심한 사과형. 계속 미안하다고 하지만 요구사항은 절대 안 굽힘. 땀을 많이 흘림.",
    issue: "미안해서 어쩌냐며 폐기물 스티커 공짜로 달라고 1시간째 사과 중",
    bg: "pantry",
    avatar: "🙏",
    imageUrl: "/10_이미안.png",
  },
];
