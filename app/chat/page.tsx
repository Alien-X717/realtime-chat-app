'use client'

import { useState } from 'react'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import {
  ConversationList,
  MessageList,
  MessageInput,
  TypingIndicator,
} from '@/components/chat'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { useSocket } from '@/hooks/useSocket'

interface Conversation {
  id: string
  type: 'dm' | 'group'
  name: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

function ChatContent() {
  const { user, logout } = useAuth()
  const { isConnected } = useSocket()
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(
    null
  )

  return (
    <div className="bg-background flex h-screen">
      {/* Sidebar */}
      <div className="flex w-80 flex-col border-r">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h1 className="font-semibold">Chats</h1>
            <p className="text-muted-foreground text-xs">
              {user?.displayName || user?.username}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
              title={isConnected ? 'Connected' : 'Disconnected'}
            />
            <Button variant="ghost" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          <ConversationList
            selectedId={selectedConversation?.id}
            onSelect={setSelectedConversation}
          />
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        {selectedConversation ? (
          <>
            {/* Chat header */}
            <div className="border-b p-4">
              <h2 className="font-semibold">
                {selectedConversation.type === 'group'
                  ? selectedConversation.name
                  : 'Direct Message'}
              </h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden">
              <MessageList conversationId={selectedConversation.id} />
            </div>

            {/* Typing indicator */}
            <TypingIndicator conversationId={selectedConversation.id} />

            {/* Input */}
            <MessageInput conversationId={selectedConversation.id} />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <Card className="p-8 text-center">
              <h2 className="mb-2 text-lg font-semibold">Welcome to Chat</h2>
              <p className="text-muted-foreground">
                Select a conversation to start messaging
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatContent />
    </ProtectedRoute>
  )
}
