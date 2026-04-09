'use client'

import { stripHtmlForSpeech } from "@/lib/utils";
import { Square, Volume2, VolumeX } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { useSpeech } from "react-text-to-speech";

interface ChatMessageComponentProps {
    content: string;
    isPlaying: boolean;
    instantPlayStartPlay: boolean;
    setIsPlaying: Dispatch<SetStateAction<boolean>>;
}

const ChatMessageComponent = ({ content, isPlaying, setIsPlaying, instantPlayStartPlay = false }: ChatMessageComponentProps) => {
    const [startPlay, setStartPlay] = useState(instantPlayStartPlay)
    const [volume, setVolume] = useState(0)
    const speechContainerRef = useRef<HTMLDivElement>(null)

    const handleStop = () => {
        setIsPlaying(false)
        setStartPlay(false)
    }

    const handleStart = () => {
        setIsPlaying(true)
        setStartPlay(true)
    }

    const { Text, start, stop } = useSpeech({
        text: stripHtmlForSpeech(content), pitch: 1, rate: 1, volume: volume, lang: 'en-US',
        autoPlay: instantPlayStartPlay, highlightText: true, showOnlyHighlightedText: false,
        highlightMode: 'word', enableDirectives: true, onStop: handleStop, onStart: handleStart
    })

    const handlePlayVoice = () => {
        if (startPlay) {
            stop()
        } else if (!isPlaying) {
            start()
        }
    }

    useEffect(() => {
        if (!isPlaying && startPlay) {
            stop()
        }
    }, [isPlaying, startPlay])

    useEffect(() => {
        const container = speechContainerRef.current
        if (!container || !startPlay) return

        const scrollHighlightedTextIntoView = () => {
            const activeMark = container.querySelector('mark')
            if (!(activeMark instanceof HTMLElement)) return

            activeMark.scrollIntoView({
                block: 'nearest',
                inline: 'nearest',
                behavior: 'smooth',
            })
        }

        scrollHighlightedTextIntoView()

        const observer = new MutationObserver(scrollHighlightedTextIntoView)
        observer.observe(container, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ['style', 'class'],
        })

        return () => observer.disconnect()
    }, [startPlay])


    return (
        <div className="flex items-start w-full flex-col gap-2">
            <div className="relative rounded-lg px-4 py-2 pr-10 text-sm whitespace-pre-wrap w-full max-w-[85%]  bg-gray-100 text-gray-900">
                <div className='max-h-64 overflow-y-auto overflow-x-auto scrollbar-hidden' ref={speechContainerRef}>
                    {
                        startPlay ? (
                            <Text
                                className="text-sm leading-6 text-gray-700 [&_mark]:rounded-sm [&_mark]:bg-amber-200 [&_mark]:px-0.5"
                            />
                        ) : (
                            <div
                                className="chat_box"
                                dangerouslySetInnerHTML={{ __html: content }}
                            />
                        )
                    }
                </div>
            </div>
            {
                startPlay ? (
                    <div className='flex gap-2'>
                        <button title={volume == 1 ? "Unmute" : "Mute"} className='border rounded p-2' onClick={() => setVolume(prev => prev == 1 ? 0 : 1)}>
                            {volume == 1 ? <Volume2 width={16} height={16} /> : <VolumeX width={16} height={16} />}
                        </button>
                        <button title={"Stop"} className='border rounded p-2' onClick={() => stop()}>
                            <Square width={16} height={16} />
                        </button>
                    </div>
                ) : (
                    <button title={"Start"} className='border rounded p-2' onClick={handlePlayVoice}>
                        <Volume2 width={16} height={16} />
                    </button>
                )
            }
        </div>
    )
}

export default ChatMessageComponent
