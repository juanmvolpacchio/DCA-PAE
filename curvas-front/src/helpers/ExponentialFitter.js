
import regression from 'regression';


export default function exponentialFitter( dataArr ) {

    const refinedArr = dataArr.map( d => !d ? 0.0001 : d)
    
    const coefs = regression.exponential(
        refinedArr.map( ( qo, i ) => [ i + 1, qo ]),
        {
            precision: 20
        }
    )

    return [ coefs.equation[0], -coefs.equation[1] ]
}