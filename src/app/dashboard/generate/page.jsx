import GenerateQuoteForm from "./component/generate-quote";

export default function GenerateQuotePage() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-primary">Generate Quote</h1>
        <p>Generate courier quotes from origin, destination, and package details.</p>
      </div>

      <GenerateQuoteForm />
    </div>
  );
}
