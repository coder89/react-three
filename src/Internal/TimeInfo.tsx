import { IThreeTimeInfo } from '../ThreeScene'

//-----------------------------------------------------------------------------
// Component
//-----------------------------------------------------------------------------

export default class TimeInfo implements IThreeTimeInfo {
    public constructor() {
        this.m_current = 0;
        this.m_delta = 0;
    }

    private m_current: number;
    public get current(): number {
        return this.m_current;
    }
    public set current(value: number) {
        this.m_delta = value - this.m_current;
        this.m_current = value;
    }

    private m_delta: number;
    public get delta(): number {
        return this.m_delta;
    }
}
