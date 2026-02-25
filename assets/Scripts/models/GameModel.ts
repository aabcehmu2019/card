import { CardData } from './CardData';

/**
 * 游戏核心数据模型
 * 
 * 功能：管理所有卡牌的状态（位置、区域），提供查询、移动、撤销操作以及匹配规则检查。
 * 使用场景：作为游戏逻辑的数据中心，被控制器（Controller）调用，驱动游戏流程。
 */
export class GameModel {
    /** 存储所有卡牌的映射，key为卡牌ID，value为卡牌数据对象 */
    private _cards: Map<number, CardData> = new Map();

    /** 移动操作的栈，用于撤销功能，记录每次移动前的卡牌所在区域和位置 */
    private _history: { cardId: number, oldArea: string, oldPos: { x: number, y: number } }[] = [];

    /**
     * 从JSON数据加载初始卡牌位置
     * @param jsonData - 包含 Playfield（牌桌区）和 Stack（牌堆区）的原始json数据
     */
    public loadData(jsonData: any): void {
        let idCounter = 0;

        // 处理主牌区（Playfield）卡牌，全部放入区域'main'
        jsonData.Playfield.forEach((item: any) => {
            const card = new CardData(
                idCounter++,
                item.CardFace,
                item.CardSuit,
                'main',
                item.Position);
            this._cards.set(card.id, card);
        });

        // 处理下方牌区（Stack）卡牌：最后一张为堆牌区（discard），其余为备用牌区（stock）
        jsonData.Stack.forEach((item: any, index: number) => {
            const area = (index === jsonData.Stack.length - 1) ? 'discard' : 'stock';
            const card = new CardData(
                idCounter++,
                item.CardFace,
                item.CardSuit,
                area,
                item.Position);
            this._cards.set(card.id, card);
        });
    }

    /**
     * 获取指定区域中的所有卡牌
     * @param area - 区域标识（如 'main', 'stock', 'discard'）
     * @returns 该区域的卡牌数组
     */
    public getCardsInArea(area: string): CardData[] {
        const result: CardData[] = [];
        this._cards.forEach(card => {
            if (card.area === area) {
                result.push(card);
            }
        });
        return result;
    }

    /**
     * 根据卡牌ID获取对应的卡牌数据
     * @param cardId 卡牌的唯一标识符
     * @returns 返回 CardData 对象，若未找到则返回 undefined
     */
    public getCardById(cardId: number): CardData | undefined {
        return this._cards.get(cardId);
    }

    /**
     * 移动一张卡牌到新区域和位置，并记录操作历史
     * @param cardId     - 要移动的卡牌ID
     * @param targetArea - 目标区域
     * @param targetPos  - 目标坐标
     * @returns 是否成功移动（卡牌存在时返回 true）
     */
    public moveCard(cardId: number, targetArea: string, targetPos: { x: number; y: number }): boolean {
        const card = this._cards.get(cardId);
        if (!card) return false;

        // 保存移动前的状态到历史栈
        this._history.push({
            cardId: card.id,
            oldArea: card.area,
            oldPos: { x: card.position.x, y: card.position.y }
        });

        // 更新卡牌数据
        card.area = targetArea;
        card.position = targetPos;
        return true;
    }

    /**
     * 撤销上一次移动操作，恢复卡牌至移动前的状态
     * @returns 被撤销的操作记录，若无历史记录则返回 null
     */
    public undo(): { cardId: number; oldArea: string; oldPos: { x: number; y: number } } | null {
        const last = this._history.pop();
        if (!last) return null;

        const card = this._cards.get(last.cardId);
        if (card) {
            card.area = last.oldArea;
            card.position = last.oldPos;
        }
        return last;
    }
}