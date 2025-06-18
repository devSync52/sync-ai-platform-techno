import ReactMarkdown from 'react-markdown'

export default function BotMessageWithCopy({ content }: { content: string }) {
  return (
    <div className="rounded-lg px-4 py-2 text-sm bg-gray-100 text-gray-900 max-w-[85%] whitespace-pre-wrap">
      <ReactMarkdown
        components={{
          a: (props) => (
            <a
              {...props}
              className="underline text-blue-700 break-all"
              target="_blank"
              rel="noopener noreferrer"
            />
          ),
          // Opcional: melhorar listas, bold etc
        }}
      >
        {content}
      </ReactMarkdown>
      {/* Se quiser, inclua botão de copiar aqui */}
      {/* <ClipboardCopyButton content={content} /> */}
    </div>
  )
}