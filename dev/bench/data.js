window.BENCHMARK_DATA = {
  "lastUpdate": 1589467175990,
  "repoUrl": "https://github.com/thomaspoignant/scim-patch",
  "entries": {
    "Benchmark.js Benchmark": [
      {
        "commit": {
          "author": {
            "email": "thomas.poignant@gmail.com",
            "name": "Thomas Poignant",
            "username": "thomaspoignant"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "be277d52bb93d37792013d28105170b72cfc6522",
          "message": "Adding performance test with Github action. (#25)",
          "timestamp": "2020-05-14T16:35:27+02:00",
          "tree_id": "5be060ed61fc27d00a4353715069cc8133239b26",
          "url": "https://github.com/thomaspoignant/scim-patch/commit/be277d52bb93d37792013d28105170b72cfc6522"
        },
        "date": 1589467175557,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "Replace query",
            "value": 354502,
            "range": "±1.77%",
            "unit": "ops/sec",
            "extra": "85 samples"
          },
          {
            "name": "Add query",
            "value": 1134271,
            "range": "±2.03%",
            "unit": "ops/sec",
            "extra": "86 samples"
          }
        ]
      }
    ]
  }
}