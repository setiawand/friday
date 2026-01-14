import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Board } from '../entities/board.entity';
import { Column, ColumnType } from '../entities/column.entity';
import { Group } from '../entities/group.entity';

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(Board)
    private boardRepo: Repository<Board>,
    @InjectRepository(Column)
    private columnRepo: Repository<Column>,
    @InjectRepository(Group)
    private groupRepo: Repository<Group>,
  ) {}

  async getAllBoards() {
    return this.boardRepo.find();
  }

  async getBoardById(id: string) {
    const board = await this.boardRepo.findOne({
      where: { id },
      relations: ['columns', 'groups'],
    });

    if (!board) throw new NotFoundException('Board not found');
    
    // Sort by position
    if (board.columns) board.columns.sort((a, b) => a.position - b.position);
    if (board.groups) board.groups.sort((a, b) => a.position - b.position);

    return board;
  }

  async createBoard(data: Partial<Board>) {
    const newBoard = this.boardRepo.create({
      ...data,
      created_at: new Date(),
    });
    
    await this.boardRepo.save(newBoard);

    // Create default columns
    await this.createColumn(newBoard.id, { title: 'Item', type: ColumnType.TEXT, position: 0 });
    await this.createColumn(newBoard.id, { title: 'Status', type: ColumnType.STATUS, position: 1, settings: { options: ['To Do', 'In Progress', 'Done'] } });
    await this.createColumn(newBoard.id, { title: 'Date', type: ColumnType.DATE, position: 2 });
    await this.createColumn(newBoard.id, { title: 'End Date', type: ColumnType.DATE, position: 3 });

    // Create default group
    await this.createGroup(newBoard.id, { name: 'Group 1', position: 0 });

    // Reload to get relations (optional, but good for returning full object)
    return this.getBoardById(newBoard.id);
  }

  async createColumn(boardId: string, data: Partial<Column>) {
    // If position not provided, put it at the end
    if (data.position === undefined) {
      const count = await this.columnRepo.count({ where: { board_id: boardId } });
      data.position = count;
    }

    const newColumn = this.columnRepo.create({
      board_id: boardId,
      created_at: new Date(),
      settings: {},
      ...data,
    });
    return this.columnRepo.save(newColumn);
  }

  async createGroup(boardId: string, data: Partial<Group>) {
    // If position not provided, put it at the end
    if (data.position === undefined) {
      const count = await this.groupRepo.count({ where: { board_id: boardId } });
      data.position = count;
    }

    const newGroup = this.groupRepo.create({
      board_id: boardId,
      ...data
    });
    return this.groupRepo.save(newGroup);
  }

  async updateGroup(boardId: string, groupId: string, data: Partial<Group>) {
    const group = await this.groupRepo.findOne({ where: { id: groupId, board_id: boardId } });
    if (!group) throw new NotFoundException('Group not found');
    
    await this.groupRepo.update({ id: groupId }, data);
    return { ...group, ...data };
  }

  async deleteGroup(boardId: string, groupId: string) {
    const group = await this.groupRepo.findOne({ where: { id: groupId, board_id: boardId } });
    if (!group) throw new NotFoundException('Group not found');
    await this.groupRepo.remove(group);
    return { success: true };
  }

  async deleteColumn(boardId: string, columnId: string) {
    const column = await this.columnRepo.findOne({ where: { id: columnId, board_id: boardId } });
    if (!column) throw new NotFoundException('Column not found');
    await this.columnRepo.remove(column);
    return { success: true };
  }

  async reorderColumns(boardId: string, columnIds: string[]) {
    // Update positions based on index
    const updates = columnIds.map((id, index) => 
      this.columnRepo.update({ id, board_id: boardId }, { position: index })
    );
    await Promise.all(updates);
    return { success: true };
  }
}
