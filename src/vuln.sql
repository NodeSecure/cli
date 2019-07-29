CREATE TABLE IF NOT EXISTS "db" (
    "id" INTEGER NOT NULL,
    "created_at" CHAR(10) NOT NULL,
    "updated_at" CHAR(10) NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "package" VARCHAR(100) NOT NULL,
    "publish_date" CHAR(10) NOT NULL,
    "author" VARCHAR(100),
    "vulnerable_versions" VARCHAR(20) NOT NULL,
    "patched_versions" VARCHAR(20),
    "overview" TEXT NOT NULL,
    "recommendation" VARCHAR(250),
    "cvss_vector" VARCHAR(30),
    "cvss_score" TINYINT,
    "cves" VARCHAR(255),
    "coordinating_vendor" VARCHAR(100)
);
