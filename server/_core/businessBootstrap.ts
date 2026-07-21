import { sql } from "drizzle-orm";
import { getDb } from "../db";

export async function ensureBusinessSchema() {
  const db = await getDb();
  if (!db) {
    console.warn("[BusinessSchema] Database unavailable; bootstrap skipped");
    return;
  }

  try {
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS priceSettings (
        id int NOT NULL AUTO_INCREMENT,
        seriesId varchar(80) NOT NULL,
        seriesName varchar(120) NOT NULL,
        basePrice decimal(10,2) NOT NULL,
        adhesiveSurcharge decimal(10,2) NOT NULL DEFAULT 65.00,
        updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY priceSettings_seriesId_unique (seriesId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `));

    await db.execute(sql.raw(`
      INSERT INTO priceSettings (seriesId, seriesName, basePrice, adhesiveSurcharge)
      VALUES
        ('nova', 'Nova', 485.00, 65.00),
        ('neo-fashion', 'Neo Fashion', 545.00, 65.00),
        ('nano-clean', 'Nano Clean', 545.00, 65.00),
        ('nano-insulation', 'Nano Insulation', 645.00, 65.00),
        ('nano-pro', 'Nano Pro', 845.00, 65.00),
        ('honeycomb', 'Honeycomb', 1000.00, 65.00)
      ON DUPLICATE KEY UPDATE seriesName = VALUES(seriesName)
    `));

    await db.execute(sql.raw("DROP TRIGGER IF EXISTS rgnfix_orders_before_insert"));
    await db.execute(sql.raw(`
      CREATE TRIGGER rgnfix_orders_before_insert
      BEFORE INSERT ON orders
      FOR EACH ROW
      SET NEW.orderNumber = CAST(
        GREATEST(
          10000,
          COALESCE((SELECT MAX(CAST(orderNumber AS UNSIGNED)) + 1 FROM orders), 10000)
        ) AS CHAR
      )
    `));

    console.log("[BusinessSchema] Sequential orders and price settings ready");
  } catch (error) {
    console.error("[BusinessSchema] Bootstrap failed:", error);
  }
}
