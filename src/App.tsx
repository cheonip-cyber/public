/**
 * 슬기로운 민원생활: 리버블 시티 프로젝트
 * @license Apache-2.0
 *
 * ■ 주요 특징
 *  - Gemini 2.0 Flash AI 대화 엔진
 *  - 10종 웹툰 스타일 캐릭터 이미지 (로컬 PNG)
 *  - 모바일 우선 반응형 (100dvh, safe-area)
 *  - 3턴 대화 → 피드백 → 회고 → 다음 민원인
 *  - 승진 애니메이션 (9급 → 시장)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import {
  Trophy, ArrowRight, Award, FastForward,
  Zap, Loader2, ChevronRight, MessageSquare,
  ShieldCheck, Heart, FileText, RotateCcw,
} from 'lucide-react';
import { NPC, Message, GameState, ActionCard } from './types';
import { RANKS, RANK_THRESHOLDS, CHARACTERS, BG_URLS } from './constants';

// ──────────────────────────────────────────────
const GEMINI_MODEL = "gemini-2.5-flash";
const MAX_TURNS = 3;
// Vite 표준 환경변수 (VITE_ 접두사) → Vercel/GitHub Actions 자동 연동
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
// Thinking 비활성화 + JSON 응답 설정 (속도 최적화)
const GEMINI_CONFIG = {
  thinkingConfig: { thinkingBudget: 0 }, // Thinking 비활성화 → 응답속도 대폭 향상
  responseMimeType: "application/json" as const,
};
// ──────────────────────────────────────────────

export default function App() {
  const [gameState, setGameState]       = useState<GameState>('INTRO');
  const [rankIdx, setRankIdx]           = useState(0);
  const [points, setPoints]             = useState(0);
  const [currentNPCIdx, setCurrentNPCIdx] = useState(-1);
  const [seenNPCs, setSeenNPCs]         = useState<number[]>([]);
  const [messages, setMessages]         = useState<Message[]>([]);
  const [isLoading, setIsLoading]       = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [showPromotion, setShowPromotion] = useState(false);
  const [currentCards, setCurrentCards] = useState<ActionCard[]>([]);
  const [turnCount, setTurnCount]       = useState(0);
  const [feedback, setFeedback]         = useState<string | null>(null);
  const [showReflection, setShowReflection] = useState(false);
  const [reflectionInput, setReflectionInput] = useState("");
  const [imgError, setImgError]         = useState<Record<number, boolean>>({});
  // 피드백 토스트 (모달 대신 인라인 토스트)
  const [toastVisible, setToastVisible] = useState(false);
  // 승진 배너 (모달 대신 상단 배너)
  const [promotionBanner, setPromotionBanner] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // 첫 NPC 랜덤 배정
  useEffect(() => {
    if (gameState === 'PLAY' && currentNPCIdx === -1) {
      const idx = Math.floor(Math.random() * CHARACTERS.length);
      setCurrentNPCIdx(idx);
      setSeenNPCs([idx]);
    }
  }, [gameState, currentNPCIdx]);

  const currentNPC: NPC = currentNPCIdx !== -1 ? CHARACTERS[currentNPCIdx] : CHARACTERS[0];

  // 스크롤 자동 이동
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // ── AI: 대화 시작 (스트리밍) ──────────────────────────────
  const startConversation = useCallback(async () => {
    setIsLoading(true);
    setStreamingText("");
    try {
      const ai = new GoogleGenAI({ apiKey: API_KEY! });
      const stream = await ai.models.generateContentStream({
        model: GEMINI_MODEL,
        contents: [{
          role: "user",
          parts: [{
            text: `너는 민원 해결 시뮬레이션 게임의 NPC '${currentNPC.name}'이야.
너는 민원을 제기하러 온 '민원인'이고 사용자는 '주무관'이야. 절대 주무관인 척하지 마.
특징: ${currentNPC.trait}
민원 내용: ${currentNPC.issue}
신입 주무관에게 첫 대사를 시작하고, 주무관이 선택할 수 있는 4가지 행동 카드를 제안해줘.

반드시 아래 JSON 형식으로만 응답해:
{
  "npc_line": "민원인의 첫 대사 (한국어, 생생하고 개성 있게)",
  "npc_mood": "현재 기분 (한 단어, 예: 화남/불만/당황/슬픔/의심)",
  "points": 0,
  "next_cards": [
    {"label": "구체적인 행동 설명 (10자 이내)", "type": "rule"},
    {"label": "구체적인 행동 설명 (10자 이내)", "type": "empathy"},
    {"label": "구체적인 행동 설명 (10자 이내)", "type": "persuade"},
    {"label": "구체적인 행동 설명 (10자 이내)", "type": "report"}
  ]
}`
          }]
        }],
        config: GEMINI_CONFIG,
      });

      // 스트리밍: 청크가 오는 즉시 화면에 표시
      let fullText = "";
      for await (const chunk of stream) {
        const chunkText = chunk.text ?? "";
        fullText += chunkText;
        setStreamingText(fullText); // 글자 단위로 즉시 업데이트
      }
      setStreamingText("");

      const data = JSON.parse(fullText || "{}");
      setMessages([{ role: 'npc', text: data.npc_line || "안녕하세요.", mood: data.npc_mood || "보통" }]);
      setCurrentCards(data.next_cards || []);
    } catch (e) {
      console.error("Gemini Error:", e);
      setStreamingText("");
      setMessages([{ role: 'npc', text: `저 ${currentNPC.name}인데요, 민원이 있어서요.`, mood: "보통" }]);
      setCurrentCards([
        { label: "규정을 안내한다", type: "rule" },
        { label: "공감해준다", type: "empathy" },
        { label: "차분히 설득한다", type: "persuade" },
        { label: "상사에게 보고", type: "report" },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [currentNPC]);

  // 대화 시작 트리거
  useEffect(() => {
    if (gameState === 'PLAY' && currentNPCIdx !== -1 && messages.length === 0) {
      startConversation();
    }
  }, [currentNPCIdx, gameState, messages.length, startConversation]);

  // ── AI: 카드 선택 처리 (스트리밍) ───────────────────────────
  const handleCardSelect = async (card: ActionCard) => {
    if (isLoading) return;
    setIsLoading(true);
    setStreamingText("");
    setMessages(prev => [...prev, { role: 'user', text: card.label }]);
    setCurrentCards([]);

    try {
      const ai = new GoogleGenAI({ apiKey: API_KEY! });
      const stream = await ai.models.generateContentStream({
        model: GEMINI_MODEL,
        contents: [{
          role: "user",
          parts: [{
            text: `너는 민원 해결 시뮬레이션 게임의 NPC '${currentNPC.name}'이야.
너는 '민원인', 사용자는 '주무관'이야.
특징: ${currentNPC.trait}
민원: ${currentNPC.issue}
주무관이 '${card.label}' 행동을 했어. 리액션 대사와 다음 4가지 행동 카드를 제안해줘.
민원인의 속마음 피드백도 한 문장으로 작성해줘. 이 행동의 적절성에 따라 점수를 줘(-10~+15).

반드시 아래 JSON 형식으로만 응답해:
{
  "npc_line": "민원인의 반응 대사 (한국어, 개성 있게)",
  "npc_mood": "현재 기분 (한 단어)",
  "feedback": "민원인 속마음 피드백 한 문장",
  "points": 10,
  "next_cards": [
    {"label": "행동1 (10자 이내)", "type": "persuade"},
    {"label": "행동2 (10자 이내)", "type": "rule"},
    {"label": "행동3 (10자 이내)", "type": "empathy"},
    {"label": "행동4 (10자 이내)", "type": "report"}
  ]
}`
          }]
        }],
        config: GEMINI_CONFIG,
      });

      // 스트리밍: 청크가 오는 즉시 대화창에 타이핑 효과로 표시
      let fullText = "";
      for await (const chunk of stream) {
        const chunkText = chunk.text ?? "";
        fullText += chunkText;
        setStreamingText(fullText);
      }
      setStreamingText("");

      const data = JSON.parse(fullText || "{}");
      const nextTurn = turnCount + 1;
      setTurnCount(nextTurn);

      const gained = typeof data.points === 'number'
        ? Math.max(-10, Math.min(15, data.points)) : 0;
      const newPoints = points + gained;
      setPoints(newPoints);

      setMessages(prev => [...prev, {
        role: 'npc',
        text: data.npc_line || "...",
        mood: data.npc_mood,
        point: gained,
      }]);

      setFeedback(data.feedback || null);
      if (data.feedback) setToastVisible(true);

      // 승진 체크 - 배너로 표시
      if (rankIdx < RANKS.length - 1 && newPoints >= RANK_THRESHOLDS[rankIdx + 1]) {
        setRankIdx(r => r + 1);
        setShowPromotion(true);
        setPromotionBanner(true);
        setTimeout(() => setPromotionBanner(false), 3500);
      }

      // MAX_TURNS 미만이면 다음 카드 노출
      if (nextTurn < MAX_TURNS) {
        setCurrentCards(data.next_cards || []);
      }
    } catch (e) {
      console.error("Gemini Error:", e);
      setStreamingText("");
      setMessages(prev => [...prev, { role: 'npc', text: "잠시 통신이 안 되네요..." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // ── 다음 NPC ─────────────────────────────────────────────
  const nextNPC = () => {
    const remaining = CHARACTERS.map((_, i) => i).filter(i => !seenNPCs.includes(i));
    if (remaining.length > 0) {
      const idx = remaining[Math.floor(Math.random() * remaining.length)];
      setCurrentNPCIdx(idx);
      setSeenNPCs(prev => [...prev, idx]);
      setMessages([]);
      setCurrentCards([]);
      setTurnCount(0);
      setFeedback(null);
      setToastVisible(false);
      setShowReflection(false);
      setReflectionInput("");
      setImgError({});
    } else {
      setGameState('ENDING');
    }
  };

  const handleFeedbackClose = () => {
    setToastVisible(false);
    setTimeout(() => {
      setFeedback(null);
      if (turnCount >= MAX_TURNS) setShowReflection(true);
    }, 300);
  };

  // 1·2번째 피드백은 2.5초 후 자동 닫힘 (3번째는 버튼으로만 닫힘)
  useEffect(() => {
    if (toastVisible && turnCount < MAX_TURNS) {
      const timer = setTimeout(() => handleFeedbackClose(), 2500);
      return () => clearTimeout(timer);
    }
  }, [toastVisible, turnCount]);

  // ── 카드 스타일 ──────────────────────────────────────────
  const cardIcon = (type: string) => {
    switch (type) {
      case 'persuade': return <MessageSquare className="w-3.5 h-3.5 shrink-0" />;
      case 'rule':     return <ShieldCheck   className="w-3.5 h-3.5 shrink-0" />;
      case 'empathy':  return <Heart         className="w-3.5 h-3.5 shrink-0" />;
      case 'report':   return <FileText      className="w-3.5 h-3.5 shrink-0" />;
      default:         return <Zap           className="w-3.5 h-3.5 shrink-0" />;
    }
  };

  const cardStyle = (type: string) => {
    const base = "bg-white border-2 p-2.5 rounded-xl text-left transition-all group shadow-[3px_3px_0px_rgba(15,23,42,0.7)] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed";
    switch (type) {
      case 'persuade': return `${base} border-blue-400  hover:bg-blue-600  hover:border-blue-600  hover:text-white hover:shadow-none`;
      case 'rule':     return `${base} border-slate-400 hover:bg-slate-700 hover:border-slate-700 hover:text-white hover:shadow-none`;
      case 'empathy':  return `${base} border-pink-400  hover:bg-pink-600  hover:border-pink-600  hover:text-white hover:shadow-none`;
      case 'report':   return `${base} border-amber-400 hover:bg-amber-500 hover:border-amber-500 hover:text-white hover:shadow-none`;
      default:         return `${base} border-blue-400  hover:bg-blue-600  hover:text-white hover:shadow-none`;
    }
  };

  const lastNPCMsg = [...messages].reverse().find(m => m.role === 'npc');
  const showNextBtn = !isLoading
    && currentCards.length === 0
    && messages.length > 0
    && turnCount >= MAX_TURNS
    && !toastVisible
    && !showReflection;

  // ════════════════════════════════════════════
  //  API KEY 없음 에러 화면
  // ════════════════════════════════════════════
  if (!API_KEY) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
        <div className="bg-white border-[8px] border-red-500 rounded-[40px] p-8 max-w-md w-full text-center space-y-6 shadow-[16px_16px_0px_rgba(239,68,68,1)]">
          <div className="text-6xl">⚠️</div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900">API 키가 없습니다</h1>
            <p className="text-sm text-slate-500 font-bold leading-relaxed">
              <span className="text-red-500 font-black">VITE_GEMINI_API_KEY</span> 환경변수가<br />
              설정되지 않았습니다.
            </p>
          </div>
          <div className="bg-slate-50 border-4 border-slate-900 rounded-2xl p-5 text-left space-y-3">
            <p className="text-xs font-black text-slate-700 uppercase tracking-widest">설정 방법</p>
            <div className="space-y-2 text-xs font-bold text-slate-600">
              <p>① <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-600 underline">aistudio.google.com</a> 에서 API 키 발급</p>
              <p>② Vercel 또는 GitHub 환경변수에 등록:</p>
              <code className="block bg-slate-900 text-green-400 px-3 py-2 rounded-lg text-[11px]">
                VITE_GEMINI_API_KEY = AIza...
              </code>
            </div>
          </div>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
            className="block w-full py-4 bg-red-500 text-white font-black rounded-2xl hover:bg-red-600 transition-all"
          >
            API 키 발급받기 →
          </a>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════
  //  INTRO
  // ════════════════════════════════════════════
  if (gameState === 'INTRO') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans relative overflow-hidden">
        {/* 배경 */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://picsum.photos/seed/city2025/1920/1080')] bg-cover bg-center grayscale" />
        <div className="absolute inset-0 bg-slate-950/65" />

        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="relative z-10 bg-white border-[8px] border-slate-900 rounded-[40px] p-8 md:p-14 max-w-lg w-full text-center space-y-8 shadow-[16px_16px_0px_rgba(15,23,42,1)]"
        >
          <div className="space-y-4">
            <motion.div
              initial={{ rotate: -5, opacity: 0 }}
              animate={{ rotate: -2, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-block bg-slate-900 px-5 py-1.5 rounded-xl"
            >
              <span className="text-white font-black text-xs tracking-[0.4em] uppercase">Simulation RPG</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-none">
              신입의<br />
              <span className="text-blue-600 italic underline decoration-slate-900 decoration-[10px] underline-offset-8">
                역습!!
              </span>
            </h1>

            <p className="text-base text-slate-500 font-bold leading-relaxed">
              서대문구청에 오신 걸 환영합니다.<br />
              <span className="text-slate-700 font-black">10명의 민원인</span>을 해결하고 <span className="text-blue-600 font-black">시장</span>이 되세요!
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.04, rotate: 1 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setGameState('PLAY')}
            className="w-full inline-flex items-center justify-center px-8 py-5 font-black text-xl text-white bg-slate-900 rounded-2xl shadow-[8px_8px_0px_rgba(37,99,235,1)] hover:shadow-[4px_4px_0px_rgba(37,99,235,1)] transition-all duration-150"
          >
            발령지로 이동 <ArrowRight className="ml-3 w-6 h-6" />
          </motion.button>

          <div className="flex justify-center gap-6 pt-4 border-t-4 border-slate-100">
            {[
              ["🧑‍💼", "10명", "민원인"],
              ["🤖", "Gemini", "AI 엔진"],
              ["🏆", "시장", "최종 목표"],
            ].map(([emoji, val, label]) => (
              <div key={label} className="text-center">
                <div className="text-2xl">{emoji}</div>
                <p className="text-sm font-black text-slate-900">{val}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // ════════════════════════════════════════════
  //  ENDING
  // ════════════════════════════════════════════
  if (gameState === 'ENDING') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(37,99,235,0.15)_0%,_transparent_70%)]" />
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="relative bg-white border-[8px] border-slate-900 rounded-[40px] p-8 max-w-sm w-full text-center space-y-6 shadow-[16px_16px_0px_rgba(15,23,42,1)]"
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <Trophy className="w-24 h-24 text-yellow-400 mx-auto drop-shadow-[0_8px_0px_rgba(15,23,42,1)]" />
          </motion.div>

          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">명예로운 퇴임</h1>
            <p className="text-base text-slate-600 font-bold mt-2 leading-relaxed">
              <span className="text-blue-600 font-black">{RANKS[rankIdx]}</span>으로서<br />
              리버블 시티를 살기 좋은 도시로 만들었습니다! 🎉
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              ["Final Rank", RANKS[rankIdx], "text-slate-900"],
              ["Total Score", `${points} pt`, "text-blue-600"],
            ].map(([label, val, color]) => (
              <div key={label} className="bg-slate-50 p-4 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_rgba(15,23,42,1)]">
                <p className="text-[10px] text-slate-400 font-black uppercase mb-1">{label}</p>
                <p className={`text-base font-black ${color}`}>{val}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <RotateCcw className="w-4 h-4" /> 다시 시작하기
          </button>
        </motion.div>
      </div>
    );
  }

  // ════════════════════════════════════════════
  //  PLAY (메인 게임화면)
  // ════════════════════════════════════════════
  return (
    <div className="h-[100dvh] w-screen bg-slate-900 flex flex-col overflow-hidden font-sans relative">

      {/* ── 배경 ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`bg-${currentNPC.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${BG_URLS[currentNPC.bg]})` }}
        >
          <div className="absolute inset-0 bg-slate-900/55" />
        </motion.div>
      </AnimatePresence>

      {/* ── 승진 배너 (상단 슬라이드다운) ── */}
      <AnimatePresence>
        {promotionBanner && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-0 left-0 right-0 z-[50] flex justify-center pt-2 px-4 pointer-events-none"
          >
            <div className="flex items-center gap-3 bg-blue-600 border-2 border-slate-900 px-5 py-2.5 rounded-2xl shadow-[0_8px_0px_rgba(15,23,42,0.6)]">
              <Award className="w-5 h-5 text-white shrink-0" />
              <div>
                <p className="text-white font-black text-xs uppercase tracking-widest leading-none">승진!</p>
                <p className="text-blue-200 font-black text-sm leading-tight">{RANKS[rankIdx]}</p>
              </div>
              <span className="text-2xl">🎉</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HUD 상단 ── */}
      <div className="relative z-20 flex items-center justify-between px-3 pt-3 pb-0 safe-top">
        {/* 계급 + 점수 */}
        <div className="flex gap-2 items-center">
          <div className="bg-blue-600 border-2 border-slate-900 px-3 py-1 rounded-xl shadow">
            <span className="text-white font-black text-xs tracking-wide">{RANKS[rankIdx]}</span>
          </div>
          <div className="bg-slate-900/80 backdrop-blur border-2 border-white/10 px-3 py-1 rounded-xl">
            <span className="text-blue-400 font-black text-xs">{points} pt</span>
          </div>
        </div>

        {/* 우측 버튼 */}
        <div className="flex gap-1.5 items-center">
          <span className="text-white/40 text-xs font-bold mr-0.5">
            {seenNPCs.length}/{CHARACTERS.length}
          </span>
          <button
            onClick={() => !isLoading && nextNPC()}
            title="건너뛰기"
            className="p-2 bg-white/10 backdrop-blur border border-white/20 rounded-xl text-white hover:bg-white/25 active:scale-95 transition-all"
          >
            <FastForward className="w-4 h-4" />
          </button>
          <button
            onClick={() => window.location.reload()}
            title="처음으로"
            className="p-2 bg-white/10 backdrop-blur border border-white/20 rounded-xl text-white hover:bg-white/25 active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── 캐릭터 패널 (민원인 중앙 단독) ── */}
      <div className="relative z-10 flex-1 flex items-end justify-center px-4 md:px-16 pointer-events-none min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={`npc-${currentNPC.id}`}
            initial={{ opacity: 0, y: 30, scale: 0.93 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="relative h-[92%] w-full max-w-sm md:max-w-md"
          >
            <div className="relative w-full h-full border-4 border-slate-900 bg-black/20 backdrop-blur-sm rounded-3xl overflow-hidden shadow-[0_16px_0px_rgba(15,23,42,0.6)]">

              {/* 감정 뱃지 */}
              {lastNPCMsg?.mood && (
                <motion.div
                  key={lastNPCMsg.mood}
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: -3 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="absolute top-3 left-3 z-10 bg-yellow-400 border-2 border-slate-900 px-3 py-1 rounded-xl shadow-lg text-slate-900 font-black text-xs uppercase whitespace-nowrap"
                >
                  {lastNPCMsg.mood}!!
                </motion.div>
              )}

              {/* 민원 유형 뱃지 (우측 상단) */}
              <div className="absolute top-3 right-3 z-10 bg-slate-900/80 backdrop-blur border border-white/20 px-2.5 py-1 rounded-xl">
                <span className="text-white/70 font-black text-[10px]">{currentNPC.avatar} {currentNPC.name}</span>
              </div>

              {/* 캐릭터 이미지 */}
              {!imgError[currentNPC.id] ? (
                <img
                  key={currentNPC.id}
                  src={currentNPC.imageUrl}
                  alt={currentNPC.name}
                  onError={() => setImgError(prev => ({ ...prev, [currentNPC.id]: true }))}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-slate-800/50">
                  <span className="text-8xl">{currentNPC.avatar}</span>
                  <span className="text-white/60 text-sm font-black">{currentNPC.name}</span>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── 피드백 토스트 (대화창 위 슬라이드업) ── */}
      <AnimatePresence>
        {feedback && toastVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-20 px-2 md:px-6 mb-1"
          >
            <div className="w-full max-w-2xl mx-auto bg-yellow-400 border-2 border-slate-900 rounded-2xl shadow-[0_4px_0px_rgba(15,23,42,0.6)] overflow-hidden">
              {/* 피드백 텍스트 */}
              <div className="px-4 pt-3 pb-2 flex items-start gap-2">
                <span className="text-base shrink-0">💭</span>
                <p className="text-slate-900 font-black text-sm md:text-base leading-snug flex-1">
                  {feedback}
                </p>
              </div>
              {/* 3번째 턴(마지막)에만 '다음 진행' 버튼 표시 */}
              {turnCount >= MAX_TURNS && (
                <button
                  onClick={handleFeedbackClose}
                  className="w-full bg-slate-900 text-white font-black text-sm py-3 flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors active:scale-[0.99]"
                >
                  다음 진행 <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 회고 인라인 (모달 대신 대화창 위에 슬라이드업) ── */}
      <AnimatePresence>
        {showReflection && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-20 px-2 md:px-6 mb-1"
          >
            <div className="w-full max-w-2xl mx-auto bg-white border-2 border-slate-900 rounded-2xl p-4 shadow-[0_4px_0px_rgba(15,23,42,0.5)]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">✨</span>
                <p className="text-slate-900 font-black text-xs uppercase tracking-widest">고민해보기</p>
                <span className="ml-auto text-[10px] text-slate-400 font-bold">
                  '{currentNPC.name}' 유형에 어떻게 응대할까요?
                </span>
              </div>
              <textarea
                value={reflectionInput}
                onChange={e => setReflectionInput(e.target.value)}
                placeholder="자유롭게 생각을 적어보세요..."
                className="w-full h-16 p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all resize-none"
              />
              {/* 버튼: 다음 민원인 (풀 너비) */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={nextNPC}
                className="mt-2 w-full bg-slate-900 text-white text-sm font-black py-3 rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                다음 민원인 <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 대화창 + 카드 ── */}
      <div className="relative z-20 px-2 md:px-6 pb-3">
        <div className="w-full max-w-2xl mx-auto bg-white border-4 border-slate-900 rounded-3xl px-4 pt-6 pb-4 shadow-[0_10px_0px_rgba(15,23,42,1)] relative">

          {/* NPC 이름 태그 */}
          <div className="absolute -top-6 left-6 bg-slate-900 px-4 py-1.5 rounded-xl shadow-lg transform -rotate-1 z-10">
            <span className="text-white font-black text-sm tracking-widest">{currentNPC.name}</span>
          </div>

          {/* 대화창 */}
          <div
            ref={scrollRef}
            className="h-[90px] md:h-[112px] overflow-y-auto flex flex-col gap-2 scrollbar-hide"
          >
            {messages.slice(-3).map((msg, idx, arr) => {
              // key를 전체 messages 배열 기준 고유 인덱스로 계산 → slice 후에도 key 불변
              const globalIdx = messages.length - arr.length + idx;
              return (
                <motion.div
                  key={globalIdx}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[90%] px-3 py-2 rounded-xl border-2 border-slate-900 text-xs md:text-sm font-bold leading-snug
                    ${msg.role === 'user'
                      ? 'bg-blue-100 text-blue-900'
                      : 'bg-slate-50 text-slate-900'
                    }`}
                  >
                    {msg.role === 'user' && (
                      <span className="text-blue-500 font-black mr-1">나신입:</span>
                    )}
                    {msg.text}
                    {typeof msg.point === 'number' && msg.point !== 0 && (
                      <span className={`ml-1.5 text-[10px] font-black ${msg.point > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {msg.point > 0 ? `+${msg.point}` : msg.point}pt
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* 스트리밍 말풍선: AnimatePresence로 등장/퇴장 부드럽게 처리
                한 번 마운트된 후 텍스트만 업데이트 → 중간에 튀는 현상 제거 */}
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  key="streaming-bubble"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="flex justify-start"
                >
                  <div className="max-w-[90%] px-3 py-2 rounded-xl border-2 border-blue-300 bg-blue-50 text-slate-900 text-xs md:text-sm font-bold leading-snug min-h-[32px]">
                    {streamingText ? (
                      <>
                        {/* JSON 스트리밍 중 npc_line 부분만 추출해서 표시 */}
                        {(() => {
                          const match = streamingText.match(/"npc_line"\s*:\s*"((?:[^"\\]|\\.)*)"/);
                          const text = match
                            ? match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"')
                            : null;
                          // npc_line이 아직 파싱 안 됐으면 "..." 표시
                          return text || "...";
                        })()}
                        <span className="inline-block w-1 h-3 ml-0.5 bg-blue-400 animate-pulse rounded-sm align-middle" />
                      </>
                    ) : (
                      /* 스트리밍 시작 전: 점 3개 로딩 */
                      <span className="flex items-center gap-1">
                        {[0, 1, 2].map(i => (
                          <span
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </span>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 초기 등장 로딩 (메시지 0개 + 스트리밍 없을 때) */}
            {isLoading && !streamingText && messages.length === 0 && (
              <div className="flex justify-center items-center h-full gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                <span className="text-slate-400 text-xs font-bold">민원인 등장 중...</span>
              </div>
            )}
          </div>

          {/* 액션 카드 */}
          {currentCards.length > 0 && (
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              {currentCards.map((card, idx) => (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleCardSelect(card)}
                  disabled={isLoading}
                  className={cardStyle(card.type)}
                >
                  <div className="flex items-start gap-1.5">
                    <span className="mt-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      {cardIcon(card.type)}
                    </span>
                    <p className="text-[11px] md:text-xs font-black leading-tight">{card.label}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          )}

          {/* 다음 민원인 버튼 */}
          {showNextBtn && (
            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={nextNPC}
              className="mt-2.5 w-full bg-slate-900 text-white py-3.5 rounded-2xl font-black text-sm hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              다음 민원인 응대하기 <ArrowRight className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
