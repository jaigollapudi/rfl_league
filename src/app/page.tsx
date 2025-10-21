export default function Landing() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-lg overflow-hidden bg-white shadow-lg">
          <img src="/img/PFL_Logo.jpeg" alt="PFL Logo" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-4xl font-extrabold text-rfl-navy mb-3">Pristine Fitness League</h1>
        <p className="text-gray-700 mb-8">Sign up or log in to get started.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 justify-center">
          <a href="/signin" className="inline-block w-full px-6 py-3 rounded-md bg-rfl-navy text-white font-medium text-center">Log In</a>
          <a href="/signup" className="inline-block w-full px-6 py-3 rounded-md bg-rfl-coral text-white font-medium text-center">Sign Up</a>
        </div>
      </div>
    </div>
  );
}