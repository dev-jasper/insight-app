import React from "react";

type State = { hasError: boolean; message: string };

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, State> {
    state: State = { hasError: false, message: "" };

    static getDerivedStateFromError(error: unknown) {
        return { hasError: true, message: error instanceof Error ? error.message : "Something went wrong." };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="mx-auto mt-10 max-w-xl rounded-xl border p-6">
                    <h1 className="text-xl font-semibold">App crashed</h1>
                    <p className="mt-2 text-gray-700">{this.state.message}</p>
                    <button
                        className="mt-4 rounded-lg border px-3 py-2"
                        onClick={() => window.location.reload()}
                    >
                        Reload
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}