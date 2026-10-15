"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Play, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type Lookup = { seasons: Array<{id:number;name:string}>; championships:Array<{id:number;name:string;seasonId:number}>; teams:Array<{id:number;name:string;championshipId:number}>; moments:Array<{id:number;name:string}>; subMoments:Array<{id:number;name:string;momentId:number}>; actions:Array<{id:number;name:string;subMomentId:number}> };
type Player = { id:number; name:string; teamId:number };
type ReportGoal = { id:number; minute:number; teamName:string; opponentName?:string|null; involvedPlayerName?:string|null; momentName?:string|null; subMomentName?:string|null; actions:string[]; hasVideo:boolean; mediaAssetId?:string|null; videoPath?:string|null; attackDirection?:"left_to_right"|"right_to_left" };

async function fetchJson<T>(url:string):Promise<T>{ const response=await fetch(url); const data=await response.json(); if(!response.ok) throw new Error(data.error||"Pedido sem sucesso"); return data; }

export function ReportsClient(){
  const [filters,setFilters]=useState<Record<string,string>>({});
  const [selectedId,setSelectedId]=useState<number|null>(null);
  const [playAll,setPlayAll]=useState(false);
  const videoRef=useRef<HTMLVideoElement|null>(null);
  const lookupsQuery=useQuery({queryKey:["reports-lookups"],queryFn:()=>fetchJson<Lookup>("/api/lookups?includeInactive=1")});
  const playersQuery=useQuery({queryKey:["reports-players"],queryFn:()=>fetchJson<Player[]>("/api/manage/players")});
  const query=useMemo(()=>{const params=new URLSearchParams();Object.entries(filters).forEach(([key,value])=>value&&params.set(key,value));return params.toString();},[filters]);
  const goalsQuery=useQuery({queryKey:["reports-goals",query],queryFn:()=>fetchJson<ReportGoal[]>(`/api/reports/goals${query?`?${query}`:""}`)});
  const data=lookupsQuery.data;
  const championships=(data?.championships??[]).filter((item)=>!filters.seasonId||item.seasonId===Number(filters.seasonId));
  const teams=(data?.teams??[]).filter((item)=>!filters.championshipId||item.championshipId===Number(filters.championshipId));
  const subMoments=(data?.subMoments??[]).filter((item)=>!filters.momentId||item.momentId===Number(filters.momentId));
  const catalogActions=(data?.actions??[]).filter((item)=>!filters.subMomentId||item.subMomentId===Number(filters.subMomentId));
  const players=(playersQuery.data??[]).filter((item)=>!filters.teamId||item.teamId===Number(filters.teamId));
  const goals=useMemo(()=>goalsQuery.data??[],[goalsQuery.data]);
  const videoGoals=useMemo(()=>goals.filter((goal)=>goal.hasVideo),[goals]);
  const selected=goals.find((goal)=>goal.id===selectedId)??videoGoals[0]??goals[0]??null;
  const playback=selected?.mediaAssetId?`/api/media/assets/${selected.mediaAssetId}/playback`:selected?.videoPath||null;
  const setFilter=(name:string,value:string)=>{setPlayAll(false);setFilters((current)=>({...current,[name]:value}));};
  useEffect(()=>{if(!goals.length){setSelectedId(null);setPlayAll(false);}else if(!selectedId||!goals.some((goal)=>goal.id===selectedId))setSelectedId((videoGoals[0]??goals[0]).id);},[goals,selectedId,videoGoals]);
  useEffect(()=>{if(playAll&&playback)videoRef.current?.play().catch(()=>setPlayAll(false));},[playAll,selectedId,playback]);
  const next=()=>{if(!playAll||!selected)return;const goal=videoGoals[videoGoals.findIndex((item)=>item.id===selected.id)+1];if(goal)setSelectedId(goal.id);else setPlayAll(false);};
  const options=(items:Array<{id:number;name:string}>)=>items.map((item)=><option key={item.id} value={item.id} className="text-black">{item.name}</option>);
  return <div className="space-y-6">
    <div><h1 className="text-2xl font-semibold">Reports de golos sofridos</h1><p className="text-sm text-muted-foreground">Combina filtros, revê os lances e reproduz apenas os golos com vídeo.</p></div>
    <Card><CardHeader title="Filtros" description="Todos os filtros são combináveis."/><CardContent className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
      <Select value={filters.seasonId??""} onChange={(e)=>setFilter("seasonId",e.target.value)}><option value="">Todas as épocas</option>{options(data?.seasons??[])}</Select>
      <Select value={filters.championshipId??""} onChange={(e)=>setFilter("championshipId",e.target.value)}><option value="">Todas as competições</option>{options(championships)}</Select>
      <Select value={filters.teamId??""} onChange={(e)=>setFilter("teamId",e.target.value)}><option value="">Todas as equipas</option>{options(teams)}</Select>
      <Select value={filters.opponentTeamId??""} onChange={(e)=>setFilter("opponentTeamId",e.target.value)}><option value="">Todos os adversários</option>{options(teams)}</Select>
      <Select value={filters.momentId??""} onChange={(e)=>setFilter("momentId",e.target.value)}><option value="">Todos os momentos</option>{options(data?.moments??[])}</Select>
      <Select value={filters.subMomentId??""} onChange={(e)=>setFilter("subMomentId",e.target.value)}><option value="">Todas as fases</option>{options(subMoments)}</Select>
      <Select value={filters.actionId??""} onChange={(e)=>setFilter("actionId",e.target.value)}><option value="">Todas as ações</option>{options(catalogActions)}</Select>
      <Select value={filters.involvedPlayerId??""} onChange={(e)=>setFilter("involvedPlayerId",e.target.value)}><option value="">Todos os jogadores relevantes</option>{options(players)}</Select>
      <div className="grid grid-cols-2 gap-2"><Input type="number" min={0} max={130} placeholder="Minuto inicial" value={filters.minuteFrom??""} onChange={(e)=>setFilter("minuteFrom",e.target.value)}/><Input type="number" min={0} max={130} placeholder="Minuto final" value={filters.minuteTo??""} onChange={(e)=>setFilter("minuteTo",e.target.value)}/></div>
      <Select value={filters.hasVideo??""} onChange={(e)=>setFilter("hasVideo",e.target.value)}><option value="">Com ou sem vídeo</option><option value="true">Com vídeo</option><option value="false">Sem vídeo</option></Select>
      <Select value={filters.attackDirection??""} onChange={(e)=>setFilter("attackDirection",e.target.value)}><option value="">Todos os sentidos</option><option value="left_to_right">Esquerda → direita</option><option value="right_to_left">Direita → esquerda</option></Select>
      <Button type="button" variant="secondary" onClick={()=>setFilters({})}>Limpar filtros</Button>
    </CardContent></Card>
    <Card><CardHeader title={`${goals.length} golos encontrados`} description="Os golos sem vídeo continuam visíveis e não entram no Play all."/><CardContent>
      {goalsQuery.isLoading?<p className="text-sm text-muted-foreground">A carregar...</p>:goals.length===0?<p className="text-sm text-muted-foreground">Nenhum golo corresponde aos filtros.</p>:<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-3 rounded-2xl border border-border/60 bg-slate-950/50 p-3"><div className="flex items-center justify-between gap-2"><div><p className="font-semibold">{selected?.teamName} vs {selected?.opponentName??"—"} · {selected?.minute}&apos;</p><p className="text-xs text-muted-foreground">{selected?.involvedPlayerName??"—"}</p></div><div className="flex gap-2"><Button size="sm" onClick={()=>{if(videoGoals.length){setSelectedId((videoGoals.find((g)=>g.id===selected?.id)??videoGoals[0]).id);setPlayAll(true);}}} disabled={!videoGoals.length}><Play className="mr-1 h-4 w-4"/>Play all ({videoGoals.length})</Button>{selected&&<Link href={`/stats/goal/${selected.id}`}><Button variant="ghost" size="sm"><ExternalLink className="mr-1 h-4 w-4"/>Detalhes</Button></Link>}</div></div>{playback?<video key={selected?.id} ref={videoRef} controls autoPlay={playAll} className="aspect-video w-full rounded-xl bg-black" src={playback} onEnded={next}/>:<div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-border/60 text-muted-foreground">Sem vídeo</div>}</div>
        <aside className="max-h-[620px] space-y-2 overflow-y-auto">{goals.map((goal)=><div key={goal.id} className={`rounded-xl border p-3 ${goal.id===selected?.id?"border-cyan-300/60 bg-cyan-400/10":"border-border/60"}`}><button type="button" onClick={()=>{setSelectedId(goal.id);setPlayAll(false);}} className="w-full text-left"><div className="flex justify-between"><span className="font-semibold">{goal.teamName} vs {goal.opponentName??"—"}</span><Badge>{goal.minute}&apos;</Badge></div><div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">{goal.hasVideo?<Video className="h-3 w-3 text-cyan-300"/>:<span className="text-amber-200">Sem vídeo ·</span>}{goal.involvedPlayerName??"—"}</div><p className="mt-1 text-xs text-muted-foreground">{goal.momentName}{goal.subMomentName?` · ${goal.subMomentName}`:""}</p><p className="mt-1 text-[10px] text-cyan-200">{goal.attackDirection==="right_to_left"?"← Direita para esquerda":"Esquerda para direita →"}</p></button><Link href={`/stats/goal/${goal.id}`} className="mt-2 inline-flex text-xs font-semibold text-cyan-300 hover:text-cyan-100"><ExternalLink className="mr-1 h-3.5 w-3.5"/>Ver detalhes</Link></div>)}</aside>
      </div>}
    </CardContent></Card>
  </div>;
}
