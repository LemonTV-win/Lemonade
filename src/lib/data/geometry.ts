export interface Point {
	x: number;
	y: number;
}

export interface Position {
	start: Point; // starting point of the wall in percentage 0-100
	angle: number; // angle of the wall in radians
}
