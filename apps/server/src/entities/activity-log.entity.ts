import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  board_id: string;

  @Column({ nullable: true })
  item_id: string;

  @Column()
  user_id: string;

  @Column()
  action: string; // 'create_item', 'update_value', 'delete_item', 'archive_item'

  @Column()
  entity_type: string; // 'item', 'group', 'column'

  @Column()
  entity_id: string;

  @Column({ type: 'jsonb', nullable: true })
  details: any; // Store before/after values here

  @CreateDateColumn()
  created_at: Date;
}
