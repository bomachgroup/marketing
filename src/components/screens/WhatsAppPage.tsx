import { useEffect, useState } from 'react'
import { EmptyState, ErrorState, SkeletonList, Topbar } from '../shared'
import { marketingService } from '../../services/api/marketingService'
import { parseApiError } from '../../services/api/apiClient'
import { transformWhatsAppInquiries, type CsrcInquiryRow } from '../../services/transformers/marketingTransformers'
import { AppIcon } from '../../components/shared/AppIcon'

type WhatsAppState = ReturnType<typeof transformWhatsAppInquiries>

const tabs = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'broadcast', label: 'Broadcast' },
  { id: 'templates', label: 'Templates' },
]

export function WhatsAppPage() {
  const [period, setPeriod] = useState('week')
  const [activeTab, setActiveTab] = useState('inbox')
  const [selectedId, setSelectedId] = useState<string | number | undefined>()
  const [inbox, setInbox] = useState<WhatsAppState>(() => transformWhatsAppInquiries({}))
  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState('')

  async function loadInbox() {
    setIsLoading(true)
    setApiError('')
    try {
      const res = await marketingService.getCsrcInquiries({ source: 'whatsapp' })
      if (res.data) {
        const next = transformWhatsAppInquiries(res.data)
        setInbox(next)
        setSelectedId((current) => current || next.inquiries[0]?.id)
      } else if (res.error) {
        setInbox(transformWhatsAppInquiries({}))
        setApiError(parseApiError(res.error))
      }
    } catch (err) {
      setInbox(transformWhatsAppInquiries({}))
      setApiError(parseApiError(err instanceof Error ? err.message : err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    queueMicrotask(() => void loadInbox())
  }, [])

  const activeConv = inbox.inquiries.find((conversation) => conversation.id === selectedId) || inbox.inquiries[0]

  return (
    <div className="flex min-h-0 flex-col overflow-x-hidden">
      <Topbar title="WhatsApp manager" period={period} onPeriodChange={setPeriod} />

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface p-2 shadow-xs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'border border-border bg-surface shadow-xs text-text'
                    : 'text-text-3 hover:text-text'
                }`}
              >
                <span>{tab.label}</span>
                {tab.id === 'inbox' && inbox.inquiries.length > 0 && (
                  <span className="rounded-full bg-rose-500 px-1.5 text-[10px] font-extrabold text-white">
                    {inbox.inquiries.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {apiError ? <ErrorState message={apiError} onRetry={loadInbox} compact /> : null}

          {activeTab !== 'inbox' ? (
            <EmptyState title="Channel unavailable" description={`No confirmed WhatsApp ${activeTab} API is available yet.`} icon="ti-brand-whatsapp" />
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-xs">
                <h3 className="border-b border-border/80 pb-2 text-sm font-bold text-text">WhatsApp inquiries</h3>

                {isLoading ? (
                  <SkeletonList rows={5} avatar />
                ) : inbox.inquiries.length === 0 ? (
                  <EmptyState title="No WhatsApp inquiries" description="No WhatsApp inquiries were returned." icon="ti-brand-whatsapp" compact />
                ) : (
                  <div className="space-y-2">
                    {inbox.inquiries.map((conversation) => (
                      <ConversationButton
                        key={String(conversation.id || conversation.leadName)}
                        conversation={conversation}
                        selected={conversation.id === selectedId}
                        onSelect={() => setSelectedId(conversation.id)}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4 rounded-2xl border border-border bg-surface p-4 shadow-xs">
                <h3 className="border-b border-border/80 pb-2 text-sm font-bold text-text">
                  {activeConv ? `Inquiry - ${activeConv.leadName}` : 'Inquiry'}
                </h3>

                {activeConv ? (
                  <>
                    <div className="space-y-1 rounded-2xl border border-border/80 bg-surface-1 p-3.5">
                      <p className="break-words text-xs font-medium text-text">{activeConv.issue}</p>
                      <div className="text-[10px] font-medium text-text-3">{activeConv.meta}</div>
                    </div>

                    <div className="space-y-2 pt-4">
                      <textarea
                        value=""
                        disabled
                        placeholder="Reply endpoint is not available yet."
                        rows={4}
                        className="w-full resize-none rounded-xl border border-border bg-surface p-3 text-xs text-text placeholder:text-text-3 opacity-70 outline-none"
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          disabled
                          className="flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-xl bg-emerald-700 text-white opacity-50 shadow-xs"
                        >
                          <AppIcon name="send" size={14} />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-dashed border-border bg-surface-1 px-4 py-8 text-center text-xs font-medium text-text-3">
                    Select a WhatsApp inquiry.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ConversationButton({ conversation, selected, onSelect }: { conversation: CsrcInquiryRow; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full min-w-0 items-start gap-3 rounded-xl border p-3 text-left transition-all ${
        selected ? 'border-navy bg-blue-50/30' : 'border-border/80 hover:bg-surface-1'
      }`}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-900">
        {conversation.leadName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h4 className="truncate text-xs font-bold text-text">{conversation.leadName}</h4>
          <span className="shrink-0 text-[10px] font-medium text-text-3">{conversation.responseTime}</span>
        </div>
        <p className="mt-0.5 truncate text-[11px] font-medium text-text-3">{conversation.issue}</p>
      </div>
    </button>
  )
}
