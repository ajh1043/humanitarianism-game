
export  function getCampCapacity(food, healthcare, housing, admin) {
    // 1 food        = 1 refugee
    // 1 heathcare   = 1 refugee
    // 1 housing     = 2 refugees
    // 1 admin       = 4 refugees
    const foodRatio = 1;
    const healthcareRatio = 1;
    const housingRatio = 2;
    const adminRatio = 4;

    // find the number of refugees supported in each category
    const caps = [food * foodRatio, healthcare * healthcareRatio, 
                  housing * housingRatio, admin * adminRatio];

    // find lowest of the caps to return
    var lowest = Infinity;
    caps.forEach((cap) => {
        if (cap < lowest) { 
            lowest = cap;
        }
    });

    return lowest;
}
