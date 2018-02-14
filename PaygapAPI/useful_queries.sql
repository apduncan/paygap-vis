-- Histogram of director percentage
SELECT width_bucket(pc_female, 0, 1, 9) AS bucket, 
    numrange(min(pc_female), max(pc_female), '[]') as range, COUNT(*) FROM co_gender_count() 
    WHERE NOT pc_female IS NULL GROUP BY bucket ORDER BY bucket;

SELECT ((g.n - 1::NUMERIC)::NUMERIC * (1::NUMERIC/20::NUMERIC))::CHAR(4) || ' - ' || (g.n::NUMERIC * (1::NUMERIC/20::NUMERIC))::CHAR(4) AS range, COALESCE(sq.count, 0)
FROM generate_series(1, 20) g(n) LEFT JOIN
	(SELECT 
		width_bucket(pc_female, 0, 1, 19) AS bucket,  
		COUNT(*) FROM co_gender_count() 
	WHERE NOT pc_female IS NULL 
	GROUP BY bucket 
	ORDER BY bucket) sq
     ON sq.bucket = g.n
ORDER BY n;