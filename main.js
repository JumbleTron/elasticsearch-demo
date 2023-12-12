const fs = require("fs");
const toISOString = (dateString) => {
    try {
        const parts = dateString.split('/');
        const formattedDate = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
        return formattedDate.toISOString();
    } catch (_) {
        return ''
    }
}

const getData = async () => {
    return new Promise((resolve, reject) => {
            fs.readFile('data.csv', 'utf8', async (err, data) => {
            if (err) {
                if (err.errno === -2) {
                    const url = 'https://data.cityofnewyork.us/api/views/43nn-pn8j/rows.csv?accessType=DOWNLOAD';
                    console.log('Download sample data...')
                    await fetch(url).then(async (response) => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! Status: ${response.status}`);
                        }
                        try {
                            const content = await response.text();
                            fs.writeFileSync('data.csv', content);
                            resolve(content)
                        } catch (err) {
                            reject(err);
                        }
                    }).catch((er) => {
                        reject('Fetch data error:', er);
                    })
                }
            }
            resolve(data);
        })
    })
}
const parseCsv = (csvData) => {
    const rows = csvData.split('\n');
    const headers = rows[0].replace(/ /g,"_").split(',');
    const result = [];

    for (let i = 1; i < rows.length; i++) {
        const rowData = rows[i].split(',');
        const rowObject = {};

        for (let j = 0; j < headers.length; j++) {
            rowObject[headers[j]] = rowData[j];
        }

        rowObject.Coord = [rowObject['Longitude'], rowObject['Latitude']];
        if (rowObject['RECORD_DATE']) {
            rowObject.RECORD_DATE = toISOString(rowObject['RECORD_DATE']);
        } else {
            delete rowObject.RECORD_DATE;
        }
        if (rowObject['INSPECTION_DATE']) {
            rowObject.INSPECTION_DATE = toISOString(rowObject['INSPECTION_DATE']);
        } else {
            delete rowObject.RECORD_DATE;
        }
        if (rowObject['GRADE_DATE']) {
            rowObject.GRADE_DATE = toISOString(rowObject['GRADE_DATE']);
        } else {
            delete rowObject.GRADE_DATE;
        }
        result.push(rowObject);
    }

    return result;
    /*let csvRows = Object.keys(result[0]).join(",") + "\n";
    csvRows += result.map(e => Object.values(e).join(",")).join("\n");
    fs.writeFile("data.csv", csvRows, "utf-8", (err) => {
        if (err) console.log(err);
        else console.log("Data saved");
    });*/
}

const checkIfIndexExist = async () => {
    try {
        await sendRequestToElastic('nyc_restaurants', null, 'GET')
    } catch (_) {
        await createIndex();
    }
}
const checkIfDocumentsExist = async () => {
    const response = await sendRequestToElastic('nyc_restaurants/_search', null, 'GET')
    return response.hits.total.value > 0;
}

const createIndex = async () => {
    await sendRequestToElastic('nyc_restaurants', {
        "mappings": {
            "properties": {
                "ACTION": {
                    "type": "keyword"
                },
                "COORD": {
                    "type": "geo_point"
                },
                "BORO": {
                    "type": "keyword"
                },
                "BUILDING": {
                    "type": "keyword"
                },
                "CAMIS": {
                    "type": "long"
                },
                "CRITICAL_FLAG": {
                    "type": "keyword"
                },
                "CUISINE_DESCRIPTION": {
                    "type": "keyword"
                },
                "DBA": {
                    "type": "keyword"
                },
                "GRADE": {
                    "type": "keyword"
                },
                "GRADE_DATE": {
                    "format": "strict_date_optional_time||epoch_millis",
                    "type": "date"
                },
                "INSPECTION_DATE": {
                    "format": "strict_date_optional_time||epoch_millis",
                    "type": "date"
                },
                "INSPECTION_TYPE": {
                    "type": "keyword"
                },
                "PHONE": {
                    "type": "keyword"
                },
                "RECORD_DATE": {
                    "format": "strict_date_optional_time||epoch_millis",
                    "type": "date"
                },
                "SCORE": {
                    "type": "double"
                },
                "STREET": {
                    "type": "keyword"
                },
                "VIOLATION_CODE": {
                    "type": "keyword"
                },
                "VIOLATION_DESCRIPTION": {
                    "type": "text"
                },
                "ZIPCODE": {
                    "type": "long"
                }
            }
        }
    })
}

const sendRequestToElastic = async (path, data, method = 'PUT') => {
    const elasticsearchUrl = 'http://localhost:9200';
    const requestOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (data) {
        requestOptions.body = JSON.stringify(data)
    }
    if (method !== 'GET') {
        requestOptions.method = method
    }

    return await fetch(`${elasticsearchUrl}/${path}`, requestOptions)
        .then(async response => {
            if (!response.ok) {
                const error = await response.json();
                console.log(error)
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log(`Request at path "${path}" successfully.`);
            return data
        })
        .catch(error => {
            console.error('Fetch error:', error);
            throw error;
        });
}

(async () => {
    await checkIfIndexExist();
    const isExist = await checkIfDocumentsExist();
    if (isExist) {
        return;
    }

    const data = await getData();
    const documents = parseCsv(data);
    for (let i=0; i<documents.length; i++) {
        try {
            await sendRequestToElastic('nyc_restaurants/_doc', documents[i], 'POST')
        } catch (_) {}
    }
})();
