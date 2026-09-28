def monthly_payment(principal: float, annual_rate: float, years: float) -> float:
    if principal <= 0:
        return 0.0
    n = round(years * 12)
    if n <= 0:
        return principal
    r = annual_rate / 12
    if r == 0:
        return principal / n
    return principal * r / (1 - (1 + r) ** -n)
