const audiobook = [
    { column: 'id', type: 'text', isNull: false },
    { column: 'title', type: 'text', isNull: false },
    { column: 'subtitle', type: 'text', isNull: false },
    { column: 'description', type: 'text', isNull: false },
    { column: 'image', type: 'text', isNull: false },
    { column: 'author', type: 'text', isNull: false },
    { column: 'narrator', type: 'text', isNull: false },
    { column: 'runtime', type: 'integer', isNull: false },
    { column: 'language', type: 'text', isNull: false },    
    { column: 'link', type: 'text', isNull: false },
    { column: 'stars', type: 'decimal', isNull: false },
    { column: 'ratings', type: 'integer', isNull: false },
    { column: 'year', type: 'date', isNull: false },
    { column: 'lastUpdatedUtc', type: 'date', isNull: false},
    { column: 'dateCreatedUtc', type: 'date', isNull: false},
];

export interface Audiobook {
    id: string;
    title: string;
    subtitle: string;
    image: string;
    author: string;
    narrator: string;
    runtime: string;
    language: string;
    stars: string;
    ratings: string;
    year: string;
}

const status = [
    { column: 'page', type: 'integer', isNull: false },
    { column: 'index', type: 'integer', isNull: false },
];

export interface Status {
    page: number;
    index: number;
}

export const schema = [
    {
        name: 'audiobook',
        schema: audiobook
    },
    {
        name: 'status',
        schema: status
    }
];