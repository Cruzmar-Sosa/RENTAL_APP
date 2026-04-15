UPDATE "Bike" SET status = 'AVAILABLE' WHERE status = 'RESERVED';
SELECT status, COUNT(*) as count FROM "Bike" GROUP BY status;
