import React from "react";
function OpenAccount() {
    return (
        <div className="container p-5 mb-5">
            <div className="row text-center">
                <h1 className="mt-5">Ready to explore the markets?</h1>
                <p>
                    Experience a simple trading dashboard built to help you track markets, manage your portfolio, and understand your investments.
                </p>
                <button
                    className="p-2 btn btn-primary fs-5 mb-5"
                    style={{ width: "20%", margin: "0 auto" }}
                >
                    Get Started
                </button>
            </div>
        </div>
    );
}

export default OpenAccount;