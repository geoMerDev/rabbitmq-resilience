const signature = {
    IMMEDIATE_RETRY_ATTEMPTS: {
        name: 'IMMEDIATE_RETRY_ATTEMPTS',
        abbr: 'IRA'
    },
    SEND_TO_RETRY_QUEUE: {
        name: 'SEND_TO_RETRY_QUEUE',
        abbr: 'STRQ'
    },
    SEND_TO_DEAD_LETTER_QUEUE: {
        name: 'SEND_TO_DEAD_LETTER_QUEUE',
        abbr: 'SDLQ'
    },
    PROCESSING_SUCCESS: {
        name: 'PROCESSING_SUCCESS',
        abbr: 'PS'
    },
    TOTAL_PROCESSING_SUCCESS: {
        name: 'TOTAL_PROCESSING_SUCCESS',
        abbr: 'TPS'
    },
    DISCARD_MESSAGE: {
        name: 'DISCARD_MESSAGE',
        abbr: 'DM'
    }


}
export default signature;
