type Props = { mode: "create" | "edit" };

export default function InsightFormPage({ mode }: Props) {
    return (
        <div className="p-6">
            <h1 className="text-xl font-semibold">
                {mode === "create" ? "Create Insight" : "Edit Insight"}
            </h1>
        </div>
    );
}