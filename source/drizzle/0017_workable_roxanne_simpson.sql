CREATE TABLE `presentation_changes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`project_version` integer NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `presentation_changes_project` ON `presentation_changes` (`project_id`,`owner_id`);
--> statement-breakpoint
CREATE TRIGGER presentation_art_changed AFTER UPDATE OF version ON projects
WHEN NEW.version > OLD.version
BEGIN
 INSERT INTO presentation_changes(project_id,owner_id,project_version,name,created_at)
 VALUES(NEW.id,NEW.owner_id,NEW.version,NEW.name,NEW.updated_at);
END;
