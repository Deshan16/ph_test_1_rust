SELECT p.prod_id, p.prod_type, p.name, p.reorder_level, p.expiry_warning_days,
    m.company, m.generic_name, m.form, m.strength,
    COALESCE(SUM(CASE WHEN b.expiry_date >= CURDATE() THEN b.current_stock END), 0) AS stock,
    COALESCE(MAX(b.expiry_date < CURDATE() AND b.current_stock > 0), 0) AS expired,
    COALESCE(MAX(b.expiry_date >= CURDATE() AND b.current_stock > 0 AND b.expiry_date <= DATE_ADD(CURDATE(), INTERVAL p.expiry_warning_days DAY)), 0) AS in_expiry_period
FROM Product p
LEFT JOIN Medicines m ON p.prod_id = m.prod_id
LEFT JOIN Batches b ON p.prod_id = b.prod_id
WHERE (p.name LIKE ? OR m.generic_name LIKE ? OR m.company LIKE ?) AND b.is_active = TRUE
GROUP BY p.prod_id, p.name, p.reorder_level
ORDER BY p.prod_id;

SELECT b.batch_id, b.batch_number, b.unit_bought_price, b.unit_sell_price, b.expiry_date, b.current_stock,
    b.expiry_date < CURDATE() AND b.current_stock > 0 AS expired,
    b.expiry_date >= CURDATE() AND b.current_stock > 0 AND b.expiry_date <= DATE_ADD(CURDATE(), INTERVAL p.expiry_warning_days DAY) AS in_expiry_period
FROM Batches b
LEFT JOIN Product p ON b.prod_id = p.prod_id
WHERE b.prod_id = ?;

SELECT p.prod_id, p.prod_type, p.name, p.reorder_level,
    m.company, m.generic_name, m.form, m.strength,
    COALESCE(SUM(CASE WHEN b.expiry_date >= CURDATE() THEN b.current_stock END), 0) <= p.reorder_level AS low_stock,
    COALESCE(MAX(b.expiry_date >= CURDATE() AND b.current_stock > 0 AND b.expiry_date <= DATE_ADD(CURDATE(), INTERVAL p.expiry_warning_days DAY)), 0) AS in_expiry_period
FROM Product p
LEFT JOIN Medicines m ON p.prod_id = m.prod_id
LEFT JOIN Batches b ON p.prod_id = b.prod_id
WHERE (p.name LIKE "%%" OR m.generic_name LIKE "%%" OR m.company LIKE "%%") AND b.is_active = TRUE
GROUP BY p.prod_id, p.name, p.reorder_level
ORDER BY p.prod_id;

SELECT p.prod_id, p.prod_type, p.name, p.reorder_level,
    m.company, m.generic_name,
    COALESCE(SUM(CASE WHEN b.expiry_date >= CURDATE() THEN b.current_stock END), 0) AS stock,
    p.reorder_level - COALESCE(SUM(CASE WHEN b.expiry_date >= CURDATE() THEN b.current_stock END), 0) AS shortfall
FROM Product p
LEFT JOIN Medicines m ON p.prod_id = m.prod_id
LEFT JOIN Batches b ON p.prod_id = b.prod_id AND b.is_active = TRUE
GROUP BY p.prod_id, p.name, p.reorder_level
HAVING stock <= p.reorder_level
ORDER BY shortfall DESC, p.name;


SELECT p.prod_id, p.prod_type, p.name, p.reorder_level,
    m.company, m.generic_name,
    b.batch_id, b.batch_number, b.expiry_date, b.current_stock
FROM Product p
LEFT JOIN Medicines m ON p.prod_id = m.prod_id
LEFT JOIN Batches b ON p.prod_id = b.prod_id
HAVING b.expiry_date < CURDATE() AND p.name LIKE "p%"
ORDER BY p.prod_id;

SELECT b.batch_id, b.batch_number, b.unit_sell_price, b.expiry_date, b.current_stock,
    b.expiry_date >= CURDATE() AND b.current_stock > 0 AND b.expiry_date <= DATE_ADD(CURDATE(), INTERVAL p.expiry_warning_days DAY) AS in_expiry_period,
    b.expiry_date - CURDATE() AS remaining
FROM Batches b
LEFT JOIN Product p ON b.prod_id = p.prod_id
WHERE b.prod_id = 1 AND b.is_active = TRUE;

SELECT P.prod_id, P.prod_type, P.name, M.generic_name, M.company, M.form, M.strength
FROM Product P LEFT JOIN Medicines M ON M.prod_id = P.prod_id
WHERE P.name LIKE "Panadol%" OR M.generic_name LIKE "Panadol%" OR M.company LIKE "Panadol%";

SELECT * FROM Orders;