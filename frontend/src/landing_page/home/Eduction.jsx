import React from "react";
function Education() {
  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-6">
          <img src="media/images/education.svg" style={{ width: "70%" }} />
        </div>
        <div className="col-6">
          <h1 className="mb-3 fs-2">Learn. Explore. Understand.</h1>
          <p>
            Get familiar with market concepts, trading terminology, and portfolio management through a simple and accessible experience.
          </p>
          <a href="" style={{ textDecoration: "none" }}>
            Explore Markets <i class="fa fa-long-arrow-right" aria-hidden="true"></i>
          </a>
          <p className="mt-5">
            Explore market data, follow price movements, and use the dashboard to understand how different parts of a trading platform work together.
          </p>
          <a href="" style={{ textDecoration: "none" }}>
            Open Dashboard <i class="fa fa-long-arrow-right" aria-hidden="true"></i>
          </a>
        </div>
      </div>
    </div>
  );
}

export default Education;