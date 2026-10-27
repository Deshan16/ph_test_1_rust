SELECT p.prod_id, p.prod_type, p.name, p.reorder_level,
    m.company, m.generic_name, m.strength,
    COALESCE(SUM(CASE WHEN b.expiry_date >= CURDATE() THEN b.current_stock END), 0) AS stock,
    COALESCE(MAX(b.expiry_date < CURDATE() AND b.current_stock > 0), 0) AS expired,
    COALESCE(MAX(b.expiry_date >= CURDATE() AND b.current_stock > 0 AND b.expiry_date <= DATE_ADD(CURDATE(), INTERVAL p.expiry_warning_days DAY)), 0) AS in_expiry_period
FROM Product p
LEFT JOIN Medicines m ON p.prod_id = m.prod_id
LEFT JOIN Batches b ON p.prod_id = b.prod_id
WHERE p.name LIKE ? OR m.generic_name LIKE ? OR m.company LIKE ?
GROUP BY p.prod_id, p.name, p.reorder_level
ORDER BY p.prod_id;