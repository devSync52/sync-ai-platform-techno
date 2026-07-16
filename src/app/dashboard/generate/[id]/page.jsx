import GenerateQuoteForm from "../component/generate-quote";

export default async function UpdateQuotePage({ params }) {
    const { id } = await params;

    return (
        <div className="space-y-6 p-6">
            <div className="space-y-2">
                <h1 className="text-2xl font-bold text-primary">Update Quote</h1>
                <p>Update quotation details and generate refreshed courier rates.</p>
            </div>

            <GenerateQuoteForm quoteId={id} />
        </div>
    );
}
