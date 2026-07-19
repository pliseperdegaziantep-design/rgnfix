CREATE TABLE `dealers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`address` text,
	`city` varchar(100),
	`district` varchar(100),
	`phone` varchar(20),
	`whatsapp` varchar(20),
	`email` varchar(320),
	`lat` decimal(10,7),
	`lng` decimal(10,7),
	`isActive` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dealers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fabrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`description` text,
	`privacy` int,
	`sunControl` int,
	`heatInsulation` int,
	`cleaning` int,
	`durability` int,
	`blackout` int,
	`usageArea` text,
	`advantages` text,
	`disadvantages` text,
	`pricePerSqm` decimal(10,2) NOT NULL,
	`imageUrl` text,
	`colors` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fabrics_id` PRIMARY KEY(`id`),
	CONSTRAINT `fabrics_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `measurements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`sessionId` varchar(64),
	`windowType` varchar(50),
	`mountType` varchar(50),
	`width` decimal(8,2),
	`height` decimal(8,2),
	`windowCount` int DEFAULT 1,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `measurements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`orderNumber` varchar(20) NOT NULL,
	`status` enum('pending','confirmed','production','preparing','shipping','delivered','cancelled') NOT NULL DEFAULT 'pending',
	`fabricId` int,
	`fabricName` varchar(100),
	`profileColor` varchar(50),
	`fabricColor` varchar(50),
	`mountType` varchar(50),
	`width` decimal(8,2),
	`height` decimal(8,2),
	`quantity` int DEFAULT 1,
	`unitPrice` decimal(10,2),
	`mountingPrice` decimal(10,2),
	`shippingPrice` decimal(10,2),
	`totalPrice` decimal(10,2) NOT NULL,
	`customerName` varchar(200),
	`customerPhone` varchar(20),
	`customerAddress` text,
	`customerCity` varchar(100),
	`customerNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `address` text;--> statement-breakpoint
ALTER TABLE `users` ADD `city` varchar(100);