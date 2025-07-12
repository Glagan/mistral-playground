import mitt from 'mitt';

type Events = {
	'message:complete': void;
};

export const emitter = mitt<Events>();
